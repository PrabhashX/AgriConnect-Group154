# AgriConnect Android app

AgriConnect is the IT3060 HCI Group WE.3.1-154 agricultural marketplace demonstration. It provides three login roles: **buyer**, **farmer** and **delivery rider**. Kotlin hosts the bundled HTML/CSS/JavaScript interface in Android WebView; SQLite stores data on the device. The implementation and initial evidence were prepared with AI assistance. Each team member must review, understand and document work they actually perform.

## Open and run

1. Clone this repository with GitHub Desktop, or open the selected local folder in Android Studio using **File → Open**. Select the folder containing `settings.gradle`.
2. Select **JDK 21** under **File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK**. Then sync. Gradle 8.13 in this project does not run on Java 25.
3. Ensure SDK **Platform 35** and **Build-Tools 35.0.0** are installed. Initial dependency resolution needs Internet.
4. Use **Tools → Device Manager** to start an Android 15 / API 35 virtual phone. The prepared computer already has **AgriConnect API 35**.
5. Select **app** and the virtual phone in the toolbar, then click **Run ▶** or press **Shift+F10**. Open **Running Devices** to see the app in Android Studio.

The prepared computer uses Java 21 from `C:\Users\nimna\Documents\Codex\2026-10-08\we-have-to-complete-assignmet-3\work\java21\jdk-21.0.12.1+1`, and its virtual phone uses the system image under that workspace's `work/android-image-35`. Keep those local tool folders if reusing the prepared configuration. Other computers should install/select their own JDK and download their own emulator image. SDK paths, IDE settings and caches are ignored by Git.

This is a WebView app; Compose/XML Preview does not render its HTML screens. Use the live emulator or open `app/src/main/assets/index.html` in a browser. Browser preview data and Android data are separate.

## APK and demonstration

The current installable demonstration APK is **AgriConnect.apk**. In Android Studio, generate a fresh one with **Build → Generate App Bundles or APKs → Generate APKs** (older versions: **Build APK(s)**). It appears at `app/build/outputs/apk/debug/app-debug.apk`. Generate APKs provides the installable file; the normal Run action may create a `testOnly` APK.

The included APK has a verified Android debug-key v2 signature and ZIP alignment. It was installed directly on the API 35 emulator. It uses a different signing key from the earlier offline APK; a device with that old package may report an incompatible signature. Uninstalling clears local data, so preserve needed information before choosing that route.

Scroll down on the login page and use the **Buyer**, **Farmer** or **Rider** demo button. Password: **Demo@1234**. Sign out through Profile before switching roles.

1. Buyer: open Vine tomatoes, add 2 kg and check out using cash on delivery. Total: **LKR 990** (840 produce + 150 delivery).
2. Farmer: find the same order in Orders and mark it Ready for pickup. Create, edit, pause and delete a demonstration listing.
3. Rider: accept the ready job, confirm pickup, start delivery and confirm Delivered with cash collection.
4. Buyer: read Delivered/Collected, save a review and test support requests. Close and reopen the Android app; saved records remain.

## Source locations

| File | Purpose |
|---|---|
| `app/src/main/assets/app.js` | Role screens and interaction handlers |
| `app/src/main/assets/app.css` | Visual design and responsive layout |
| `app/src/main/assets/domain.js` | Permissions, CRUD, validation and order rules |
| `app/src/main/java/lk/agriconnect/app/MainActivity.kt` | Android WebView, trusted local assets and SQLite bridge |
| `app/src/main/AndroidManifest.xml` | Source manifest shared with the offline build |
| `app/build.gradle` | Android configuration and source-manifest adaptation |

## Test evidence

The recorded checks are **38 service cases**, **15 browser checks**, **10 member CRUD checks** and **8 installed Android emulator checks**, all passing. `tests/evidence` contains the original execution records, APK metadata and nine native emulator screenshots. Native NT01-NT08 cover login, checkout, support/listing CRUD, the three-role order, reviews and SQLite persistence after a complete process restart. The delivered APK matches the installed package hash. This is agent-executed automated evidence; participant sessions and physical-phone testing are separate.

Service checks with Node 20+:

```powershell
node --test tests/domain.test.cjs
```

Browser tests need Playwright and Chrome. Set `PLAYWRIGHT_MODULE`, `CHROME_PATH` and `APP_URL` as needed. Native checks require the running debug app at its login screen, ADB and Playwright Android support. They create a demonstration order without clearing data:

```powershell
$env:ADB_PATH='C:\actual\Android\Sdk\platform-tools\adb.exe'
$env:PLAYWRIGHT_MODULE='C:\actual\node_modules\playwright'
node tests/native-android.test.cjs
```

Set `ANDROID_SERIAL` if the device is not `emulator-5554`. Ensure enough tomato stock for a new 2 kg order. The standard Gradle command is `gradlew.bat assembleDebug` with a valid JDK 21 and SDK configuration. The restricted command environment failed in AAPT2 linking during preparation; the actual Android Studio build succeeded. `build.ps1` retains the original offline SDK-tool route.

## Team contributions and submission

See **CONTRIBUTING.md** for the approved role allocation and each member's own commit workflow. The initial import/setup commits record repository preparation under the repository owner's configured identity. They do not establish that all four members independently implemented their assigned interfaces. Future members should commit only changes or reviews they actually perform through their own accounts.

To display recorded author history, use GitHub Desktop's **History** tab, the GitHub repository's commits view, or the read-only `tests/show-history.ps1` helper.

The final report, editable Word file, screen gallery and simulated evaluation examples are delivered in the separate final ZIP. This repository contains the working app, APK and functional evidence.

## Scope

Orders are shared between roles on one device. Different phones do not synchronize. Passwords are salted PBKDF2-HMAC-SHA256 hashes; role/ownership checks protect local actions. Orders snapshot purchased prices, recheck stock and restore stock once on cancellation. One farmer per order is enforced. Demo payments are simulated; cash collection is a local status; no real payment, live GPS or remote support service is connected. Verification stays Pending, and Sinhala translation is partial. The final report documents these deviations.
