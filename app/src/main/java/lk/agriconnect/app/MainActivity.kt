package lk.agriconnect.app

import android.app.Activity
import android.os.Bundle
import android.content.Context
import android.content.ContentValues
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.graphics.Color
import org.json.JSONObject
import org.json.JSONArray
import java.io.ByteArrayInputStream
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/** A native Android container for the bundled mobile UI and an offline SQLite store. */
class MainActivity : Activity() {
    private lateinit var web: WebView
    private lateinit var store: LocalStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(23, 63, 49)
        window.navigationBarColor = Color.rgb(245, 246, 239)
        store = LocalStore(this)
        web = WebView(this)
        web.setBackgroundColor(Color.rgb(245, 246, 239))
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.allowFileAccess = false
        web.settings.allowContentAccess = false
        web.settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
        web.addJavascriptInterface(store, "NativeStore")
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                request.url.host != "app.agriconnect.local"

            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                val path = request.url.path?.removePrefix("/") ?: "index.html"
                if (request.url.host != "app.agriconnect.local" || path !in setOf("index.html", "app.css", "app.js", "domain.js")) {
                    return WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", emptyMap(), ByteArrayInputStream(byteArrayOf()))
                }
                val mime = when {
                    path.endsWith(".css") -> "text/css"
                    path.endsWith(".js") -> "application/javascript"
                    else -> "text/html"
                }
                return WebResourceResponse(mime, "UTF-8", assets.open(path))
            }
        }
        setContentView(web)
        web.loadUrl("https://app.agriconnect.local/index.html")
    }

    @Deprecated("Legacy back dispatch remains compatible with this dependency-free activity")
    override fun onBackPressed() {
        web.evaluateJavascript("window.appBack ? window.appBack() : false") { handled ->
            if (handled != "true") super.onBackPressed()
        }
    }

    override fun onDestroy() {
        web.removeJavascriptInterface("NativeStore")
        web.destroy()
        store.close()
        super.onDestroy()
    }
}

/** Entity documents in separate SQLite tables; a transaction makes each saved state atomic. */
class LocalStore(context: Context) : SQLiteOpenHelper(context, "agriconnect.db", null, 1) {
    private val collections = listOf("accounts", "products", "orders", "tickets", "reviews")
    override fun onCreate(db: SQLiteDatabase) {
        for (table in collections) db.execSQL("CREATE TABLE $table (id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
        db.execSQL("CREATE TABLE carts (id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
        db.execSQL("CREATE TABLE metadata (id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Schema v1 is the only published version. Add a non-destructive migration for later releases.
    }

    @JavascriptInterface
    @Synchronized
    fun load(): String {
        val db = readableDatabase
        val data = JSONObject()
        db.rawQuery("SELECT payload FROM metadata WHERE id = ?", arrayOf("state")).use { cursor ->
            if (!cursor.moveToFirst()) return ""
            val meta = JSONObject(cursor.getString(0))
            data.put("version", meta.getInt("version"))
            data.put("seq", meta.getInt("seq"))
        }
        for (table in collections) {
            val entries = JSONArray()
            db.rawQuery("SELECT payload FROM $table ORDER BY rowid", null).use { cursor ->
                while (cursor.moveToNext()) entries.put(JSONObject(cursor.getString(0)))
            }
            data.put(table, entries)
        }
        val carts = JSONObject()
        db.rawQuery("SELECT id,payload FROM carts", null).use { cursor ->
            while (cursor.moveToNext()) carts.put(cursor.getString(0), JSONArray(cursor.getString(1)))
        }
        data.put("carts", carts)
        return data.toString()
    }

    @JavascriptInterface
    @Synchronized
    fun save(payload: String) {
        require(payload.length < 10_000_000) { "Saved data is too large." }
        val data = JSONObject(payload)
        require(data.getInt("version") == 1) { "Unsupported data version." }
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (table in collections) {
                db.delete(table, null, null)
                val items = data.getJSONArray(table)
                for (i in 0 until items.length()) {
                    val item = items.getJSONObject(i)
                    val values = ContentValues().apply { put("id", item.getString("id")); put("payload", item.toString()) }
                    db.insertOrThrow(table, null, values)
                }
            }
            db.delete("carts", null, null)
            val carts = data.getJSONObject("carts")
            val keys = carts.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val values = ContentValues().apply { put("id", key); put("payload", carts.getJSONArray(key).toString()) }
                db.insertOrThrow("carts", null, values)
            }
            val meta = JSONObject().put("version", data.getInt("version")).put("seq", data.getInt("seq"))
            val values = ContentValues().apply { put("id", "state"); put("payload", meta.toString()) }
            db.insertWithOnConflict("metadata", null, values, SQLiteDatabase.CONFLICT_REPLACE)
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    @JavascriptInterface
    fun hash(password: String, salt: String): String {
        val spec = PBEKeySpec(password.toCharArray(), salt.toByteArray(Charsets.UTF_8), 120000, 256)
        return try {
            SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded.joinToString("") {
                "%02x".format(it.toInt() and 0xff)
            }
        } finally { spec.clearPassword() }
    }
}
