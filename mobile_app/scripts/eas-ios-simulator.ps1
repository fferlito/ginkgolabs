# Queue an EAS iOS Simulator build (standalone .app, like the Android APK).
# Requires: npx eas-cli login
Set-Location (Join-Path $PSScriptRoot "..")

$who = npx eas-cli whoami 2>&1 | Out-String
if ($who -match "Not logged in") {
  throw "Run 'npx eas-cli login' in mobile_app, then rerun this script."
}

$appRaw = Get-Content -Raw "app.json"
if ($appRaw -notmatch '"projectId"') {
  npx eas-cli init --account fferlito --non-interactive
  if ($LASTEXITCODE -ne 0) { throw "eas init failed." }
}

$envFile = Join-Path (Get-Location) ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -notmatch "=") { return }
    $name, $value = $_ -split "=", 2
    $name = $name.Trim()
    $value = $value.Trim().Trim("'").Trim('"')
    if ($name -notmatch "^EXPO_PUBLIC_" -or -not $value) { return }
    if ($name -eq "EXPO_PUBLIC_API_URL") { return }
    npx eas-cli env:set preview --name $name --value $value --visibility sensitive --non-interactive
    if ($LASTEXITCODE -ne 0) {
      Write-Host "eas env:set skipped or failed for $name (already set is OK). Continuing."
    }
  }
}

npx eas-cli build --platform ios --profile ios-simulator --non-interactive --no-wait
if ($LASTEXITCODE -ne 0) { throw "eas build failed." }
