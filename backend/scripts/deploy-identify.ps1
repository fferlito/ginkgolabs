# Deploy Cloud Run identify without printing secrets.
$ErrorActionPreference = "Stop"
$Project = "mushroom-detector-450321"
$Backend = Split-Path -Parent $PSScriptRoot
$Identify = Join-Path (Split-Path -Parent $Backend) "identify"
$EnvFile = Join-Path $Backend ".env"

$secret = ""
foreach ($line in Get-Content $EnvFile) {
  if ($line -like "IDENTIFY_SERVICE_SECRET=*") {
    $secret = $line.Substring("IDENTIFY_SERVICE_SECRET=".Length).Trim()
  }
}
if (-not $secret) { throw "IDENTIFY_SERVICE_SECRET missing from backend/.env" }

gcloud storage buckets update gs://mushroom-radar-user-media --cors-file=(Join-Path $PSScriptRoot "gcs-cors.json") --project=$Project

Set-Location $Identify
gcloud run deploy mushroomradar-identify `
  --source . `
  --region europe-west1 `
  --project $Project `
  --allow-unauthenticated `
  --set-env-vars "IDENTIFY_SERVICE_SECRET=$secret" `
  --quiet

$url = gcloud run services describe mushroomradar-identify --region europe-west1 --project $Project --format="value(status.url)"
$lines = Get-Content $EnvFile
$out = @()
$hasIdentify = $false
foreach ($line in $lines) {
  if ($line -like "IDENTIFY_URL=*") {
    $out += "IDENTIFY_URL=$url"
    $hasIdentify = $true
  } else {
    $out += $line
  }
}
if (-not $hasIdentify) { $out += "IDENTIFY_URL=$url" }
Set-Content -Path $EnvFile -Value $out -Encoding utf8
Write-Host "Identify service URL: $url"
