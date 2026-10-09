# AgriConnect final app source

This is the only app source folder in the final delivery. Open it in Android Studio with **File → Open**. Reports, team responsibilities, testing evidence and simulated evaluation records are in sibling folders. Start with `../00_START_HERE.html` for all final links.

## Screens and source

- `app/src/main/assets/app.js`: screen functions and interaction handlers.
- `app/src/main/assets/app.css`: appearance and responsive layout.
- `app/src/main/assets/domain.js`: role permissions, validation, stored-data CRUD and order rules.
- `app/src/main/java/lk/agriconnect/app/MainActivity.kt`: Kotlin WebView host, secure local asset loading and SQLite persistence.
- `app/src/main/assets/index.html`: working browser preview; open it in Chrome/Edge.
- `../AgriConnect_Screen_Previews/index.html`: 40 captured screens/states, role filters and source references.

This is a Kotlin-hosted hybrid Android app. Android Studio's Compose/XML preview does not render its HTML screens. Use the gallery/browser preview or run the APK on a phone/emulator and open Running Devices. Browser data and native Android data are separate. There is no standard Android Gradle green Run configuration in this delivery.

## Build and install

The final signed APK is already present as `AgriConnect.apk`; rebuilding is unnecessary for installation. This computer has Android SDK platform 35, build-tools 37.0.0, Android Studio's JBR/Kotlin tools and the Python runtime needed by the offline build. In the Android Studio terminal, from this folder:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\build.ps1 -SdkPath 'C:\Users\nimna\AppData\Local\Android\Sdk'
```

On a different computer, supply that computer's real `-SdkPath`, `-StudioPath` and `-PythonPath` values. The script records missing dependencies. Do not delete `.idea`, the app resources or scripts; they support code inspection/building. Private signing keys and generated build files are excluded from this ZIP.

If you rebuild without the original signing key, a new demo key is generated. Android may reject `install -r` over the previously signed APK. Prefer the included final APK; uninstalling an old app clears its locally saved data, so preserve needed demonstration data before choosing that route.

For a USB phone with Developer options/USB debugging enabled and its debugging prompt accepted:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r .\AgriConnect.apk
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -n lk.agriconnect.app/.MainActivity
```

You can also transfer the APK and install it from the phone's Files app. After installing, use Android Studio's Running Devices panel if the phone supports mirroring. Native launch and close/reopen persistence must be checked on an actual device or emulator; that check has not been observed in the prepared evidence.

## Demo and verification

Use Buyer/Farmer/Rider demo buttons, password **Demo@1234**. Buyer orders 2 kg Vine tomatoes for LKR 990, farmer marks the same order Ready, then rider accepts and completes it with cash collection. Sign out between roles and use the same phone. Try listing create/read/update/delete and support create/read/update/withdraw. The full member demonstration is in `../Team/MEMBER_WORKLOAD_AND_CRUD.md`.

38 service tests, 15 browser checks and 10 member CRUD checks passed in the saved `../Testing` evidence. To repeat service checks with Node 20 or newer:

```powershell
node --test tests/domain.test.cjs
```

Browser tests require Playwright and Chrome. Set `PLAYWRIGHT_MODULE` to an available Playwright package and `CHROME_PATH` to Chrome if it is not installed at the default path. Set `APP_URL` to the browser preview URL, then run `node tests/browser.test.cjs` or `node tests/member-crud.test.cjs`. On this prepared computer the available package path is `C:\Users\nimna\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright`. Direct file preview is supported, for example `APP_URL=file:///C:/actual/path/AgriConnect_AndroidStudio/app/src/main/assets/index.html`. Repeated browser checks create an `evidence` folder inside this source folder; the saved final delivery evidence is separately in `../Testing`.

## Implementation scope

Native Android persists separate JSON entity tables in SQLite through atomic transactions. Browser preview uses localStorage. Passwords use per-account salts and PBKDF2-HMAC-SHA256 with 120,000 iterations. Role and record ownership rules restrict operations. Order snapshots retain purchased prices, checkout rechecks stock, and cancellation preserves the record and restores stock once.

One farmer per order is enforced. Different devices do not synchronize. Demo payment is simulated; cash collection is a local status. Verification remains Pending, support is local, delivery progress is manual and Sinhala translation is partial. The report explains these deviations and limitations.
