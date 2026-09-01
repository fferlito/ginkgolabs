# Build the Android debug APK using a short subst path.
# Required on Windows: Ninja fails when the repo path + codegen object names exceed 260 chars.
$ErrorActionPreference = "Stop"

$javaHome = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$androidHome = "$env:LOCALAPPDATA\Android\Sdk"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not (Test-Path "$javaHome\bin\java.exe")) {
  throw "JDK 17 not found at $javaHome"
}
if (-not (Test-Path $androidHome)) {
  throw "Android SDK not found at $androidHome"
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:GRADLE_USER_HOME = "$env:USERPROFILE\.gradle"
$env:Path = "$javaHome\bin;$androidHome\platform-tools;$androidHome\cmdline-tools\latest\bin;" + $env:Path

New-Item -ItemType Directory -Force -Path C:\b | Out-Null
if (-not (Test-Path C:\b\p)) {
  cmd /c "mklink /J C:\b\p `"$repo`""
}

$mapped = subst.exe
if ($mapped -notmatch "^G:\\") {
  subst.exe G: C:\b
}

Set-Location G:\p\android
& .\gradlew.bat assembleDebug @args
