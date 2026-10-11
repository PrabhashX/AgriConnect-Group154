# AgriConnect

AgriConnect is an agricultural marketplace app for the **IT3060 HCI project, Group WE.3.1-154**. Buyers can order produce, farmers can manage their listings and orders, and delivery riders can handle deliveries. Each role has its own login and screens.

The app uses Kotlin with an Android WebView for the HTML, CSS and JavaScript screens. Records are saved locally using SQLite. AI assistance was used to prepare the app and its initial automated test evidence.

## Running the app in Android Studio

1. Clone the repository using GitHub Desktop, or use **File → Open** in Android Studio to open the project folder. Choose the folder that contains `settings.gradle`.
2. Go to **File → Settings → Build, Execution, Deployment → Build Tools → Gradle** and select **JDK 21** as the Gradle JDK. Then sync the project. This project's Gradle version does not support Java 25.
3. Make sure **Android SDK Platform 35** and **Build-Tools 35.0.0** are installed. You will need an internet connection for the first sync.
4. Open **Tools → Device Manager** and start an Android 15 / API 35 emulator. The existing setup on Nimna's computer already has the **AgriConnect API 35** emulator.
5. Select **app** and the emulator in the toolbar, then click **Run ▶** or press **Shift+F10**. The app will appear in **Running Devices**.

On Nimna's existing setup, Android Studio points to the Java and emulator files in the Codex workspace's `work` folder. Keep those files if you are using that setup. On another computer, select your own JDK 21 and download an emulator image. Local SDK paths and IDE settings are excluded from Git.

You can also open this project in VS Code to edit the files. For a quick browser preview, open `app/src/main/assets/index.html`. The screens use HTML, so Android Studio's Compose or XML Preview will not display them. Data saved in the browser is separate from data saved in the Android app.

## Trying the three roles

Scroll down on the login screen and choose **Buyer**, **Farmer** or **Rider** to use a demo account. The demo password is **Demo@1234**. Sign out from Profile before switching roles.

To try a complete order:

1. **Buyer:** open Vine tomatoes, add 2 kg to the basket and choose cash on delivery. The total is **LKR 990**: LKR 840 for the produce and LKR 150 for delivery.
2. **Farmer:** open Orders, find that order and mark it **Ready for pickup**. You can also try adding, editing, pausing and deleting a listing.
3. **Rider:** accept the delivery, confirm pickup, start the delivery and mark it **Delivered** with cash collected.
4. **Buyer:** check the updated order status, add a review and try the support request screens. Close and reopen the Android app to check that the records are still saved.

## Installing the APK

The ready-to-install file is **AgriConnect.apk**.

To create a new APK in Android Studio, select **Build → Generate App Bundles or APKs → Generate APKs**. In some versions, the option is called **Build APK(s)**. The output will be at `app/build/outputs/apk/debug/app-debug.apk`.

The included APK was checked for signing and ZIP alignment, then installed on the API 35 emulator. It uses a different signing key from the earlier offline build. If you have that older version installed, Android may refuse the update. Uninstalling the old version clears its saved data, so keep any information you need first.

## Main project files

| File | What it contains |
|---|---|
| `app/src/main/assets/app.js` | Screens and user interactions |
| `app/src/main/assets/app.css` | Colours, spacing and screen layouts |
| `app/src/main/assets/domain.js` | CRUD operations, validation, permissions and order rules |
| `app/src/main/java/lk/agriconnect/app/MainActivity.kt` | Android WebView and SQLite connection |
| `app/src/main/AndroidManifest.xml` | Android app configuration |
| `app/build.gradle` | Android build settings |

## Testing

The recorded automated checks all passed:

- 38 service test cases
- 15 browser checks
- 10 CRUD checks for the allocated interfaces
- 8 checks on the installed Android app

The results and nine emulator screenshots are in `tests/evidence`. The Android checks cover login, checkout, listings, support requests, the buyer–farmer–rider order flow, reviews and saved data after restarting the app. The included APK matches the one used for those Android checks.

These are automated results. Participant usability testing and testing on a physical phone are separate activities.

To run the service tests, use Node.js 20 or later from the project folder:

```powershell
node --test tests/domain.test.cjs
```

Browser tests need Playwright and Chrome. Set `PLAYWRIGHT_MODULE`, `CHROME_PATH` and `APP_URL` for your setup where needed.

The Android test script needs ADB, Playwright's Android support and the running debug app at its login screen. Replace the paths below with the paths on your computer:

```powershell
$env:ADB_PATH='C:\actual\Android\Sdk\platform-tools\adb.exe'
$env:PLAYWRIGHT_MODULE='C:\actual\node_modules\playwright'
node tests/native-android.test.cjs
```

Set `ANDROID_SERIAL` if your emulator is not `emulator-5554`. The test creates a new 2 kg tomato order, so make sure enough stock is available.

The Android Studio build was verified successfully. For a command-line build with JDK 21 and the SDK configured, use `gradlew.bat assembleDebug`. The earlier command-line attempt in the restricted environment stopped during AAPT2 linking. The original offline build script is still available as `build.ps1`.

## Team work and submission files

The role allocation and steps for making team commits are in **CONTRIBUTING.md**. Each member should use their own account to commit the changes or review notes they actually complete. The initial commits cover importing the source, setting up the build and adding test evidence.

You can view the commit history in GitHub Desktop's **History** tab, on GitHub, or with `tests/show-history.ps1`.

This repository contains the app source, APK and functional test evidence. The report, editable Word file, screen gallery and simulated evaluation examples are in the separate final submission ZIP.

## Current limitations

The app works locally. Buyers, farmers and riders share records on the same device; different phones do not sync through an online database.

Payments are demonstrations, and cash collection is recorded as a local status. Delivery progress is updated manually, without live GPS. Support requests are stored locally. Account verification remains **Pending**, and Sinhala translation is only partly complete.

Passwords are stored as salted PBKDF2-HMAC-SHA256 hashes, and role checks restrict access to actions. Each order is limited to one farmer. The app saves the price at checkout, checks stock again and restores it once if an order is cancelled.

The report explains these limitations and the changes from the Milestone 2 prototype.
