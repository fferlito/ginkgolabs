# Deploy Cloud Run identify without printing secrets.
$ErrorActionPreference = "Stop"
$Project = "mushroom-detector-450321"
$Backend = Split-Path -Parent $PSScriptRoot
$Identify = Join-Path (Split-Path -Parent $Backend) "identify"
$EnvFile = Join-Path $Backend ".env"

function Get-DotEnvValue([string]$Path, [string]$Key) {
  foreach ($line in Get-Content $Path) {
    if ($line.StartsWith("$Key=")) {
      return $line.Substring($Key.Length + 1).Trim()
    }
  }
  return ""
}

$secret = Get-DotEnvValue $EnvFile "IDENTIFY_SERVICE_SECRET"
$inatToken = Get-DotEnvValue $EnvFile "INATURALIST_API_TOKEN"
if (-not $secret) { throw "IDENTIFY_SERVICE_SECRET missing from backend/.env" }
if (-not $inatToken) { throw "INATURALIST_API_TOKEN missing from backend/.env" }

gcloud storage buckets update gs://mushroom-radar-user-media --cors-file=(Join-Path $PSScriptRoot "gcs-cors.json") --project=$Project

Set-Location $Identify
gcloud run deploy mushroomradar-identify `
  --source . `
  --region europe-west1 `
  --project $Project `
  --allow-unauthenticated `
  --update-env-vars "IDENTIFY_SERVICE_SECRET=$secret,INATURALIST_API_TOKEN=$inatToken" `
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
