param(
    [string]$SdkPath = "$env:LOCALAPPDATA\Android\Sdk",
    [string]$StudioPath = "C:\Program Files\Android\Android Studio",
    [string]$PythonPath = 'C:\Users\nimna\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
)
$ErrorActionPreference = 'Stop'
$taskProject = $PSScriptRoot
$taskBuild = Join-Path $taskProject 'build'
New-Item -ItemType Directory -Force -Path $taskBuild | Out-Null
$taskJdk = Join-Path $StudioPath 'jbr\bin'
$taskKotlin = Join-Path $StudioPath 'plugins\Kotlin\kotlinc.ide\lib'
$taskTools = Join-Path $SdkPath 'build-tools\37.0.0'
$taskAndroid = Join-Path $SdkPath 'platforms\android-35\android.jar'
foreach ($taskRequired in @($taskJdk, $taskKotlin, $taskTools, $taskAndroid)) { if (!(Test-Path -LiteralPath $taskRequired)) { throw "Missing build dependency: $taskRequired. See README." } }
function Invoke-Checked([string]$exe, [string[]]$arguments) { & $exe @arguments; if ($LASTEXITCODE -ne 0) { throw "Build step failed: $exe" } }
$taskCompiled = Join-Path $taskBuild 'compiled'
$taskLinked = Join-Path $taskBuild 'linked'
New-Item -ItemType Directory -Force -Path $taskCompiled,$taskLinked | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $taskLinked 'res\drawable'),(Join-Path $taskLinked 'assets') | Out-Null
Invoke-Checked (Join-Path $taskTools 'aapt2.exe') @('compile','--dir',(Join-Path $taskProject 'app\src\main\res'),'-o',$taskCompiled)
$taskFlats = @(Get-ChildItem -LiteralPath $taskCompiled -Filter '*.flat' -File | ForEach-Object { $_.FullName })
Invoke-Checked (Join-Path $taskTools 'aapt2.exe') (@('link','--output-to-dir','--manifest',(Join-Path $taskProject 'app\src\main\AndroidManifest.xml'),'-A',(Join-Path $taskProject 'app\src\main\assets'),'-I',$taskAndroid,'-o',$taskLinked)+$taskFlats)
$taskClassPath = "$taskAndroid;$taskKotlin\kotlin-stdlib.jar;$taskKotlin\annotations-13.0.jar"
Invoke-Checked (Join-Path $taskJdk 'java.exe') @('-cp',"$taskKotlin\*",'org.jetbrains.kotlin.cli.jvm.K2JVMCompiler','-no-stdlib','-no-reflect','-jvm-target','1.8','-classpath',$taskClassPath,(Join-Path $taskProject 'app\src\main\java\lk\agriconnect\app\MainActivity.kt'),'-d',(Join-Path $taskBuild 'app.jar'))
Invoke-Checked (Join-Path $taskJdk 'java.exe') @('-cp',(Join-Path $taskTools 'lib\d8.jar'),'com.android.tools.r8.D8','--min-api','26','--lib',$taskAndroid,'--output',$taskBuild,(Join-Path $taskBuild 'app.jar'),(Join-Path $taskKotlin 'kotlin-stdlib.jar'),(Join-Path $taskKotlin 'annotations-13.0.jar'))
if (!(Test-Path -LiteralPath $PythonPath)) { $PythonPath='python' }
Invoke-Checked $PythonPath @((Join-Path $taskProject 'scripts\pack_apk.py'),$taskBuild)
Invoke-Checked (Join-Path $taskTools 'zipalign.exe') @('-c','4',(Join-Path $taskBuild 'aligned.apk'))
$taskKey = Join-Path $taskBuild 'demo-signing.jks'
if (!(Test-Path -LiteralPath $taskKey)) { Invoke-Checked (Join-Path $taskJdk 'keytool.exe') @('-genkeypair','-keystore',$taskKey,'-storepass','android','-keypass','android','-alias','agriconnect-demo','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=AgriConnect Academic Demo, O=Group 154, C=LK','-noprompt') }
Invoke-Checked (Join-Path $taskJdk 'java.exe') @('-jar',(Join-Path $taskTools 'lib\apksigner.jar'),'sign','--ks',$taskKey,'--ks-key-alias','agriconnect-demo','--ks-pass','pass:android','--key-pass','pass:android','--out',(Join-Path $taskProject 'AgriConnect.apk'),(Join-Path $taskBuild 'aligned.apk'))
Invoke-Checked (Join-Path $taskJdk 'java.exe') @('-jar',(Join-Path $taskTools 'lib\apksigner.jar'),'verify','--verbose',(Join-Path $taskProject 'AgriConnect.apk'))
Write-Output "APK built: $(Join-Path $taskProject 'AgriConnect.apk')"
