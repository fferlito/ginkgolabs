# Rotate the Cloud SQL app password into backend/.env without printing it.
$ErrorActionPreference = "Stop"
$Project = "mushroom-detector-450321"
$Backend = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Backend ".env"

$buf = New-Object byte[] 24
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$rng.GetBytes($buf)
$rng.Dispose()
$sqlPw = -join ($buf | ForEach-Object { "{0:x2}" -f $_ })

gcloud sql users set-password mushroomradar --instance=mushroomradar --password=$sqlPw --project=$Project
if ($LASTEXITCODE -ne 0) { throw "Failed to set database password" }

$ip = gcloud sql instances describe mushroomradar --project=$Project --format="value(ipAddresses[0].ipAddress)"
$identifySecret = ""
if (Test-Path $EnvFile) {
  foreach ($line in Get-Content $EnvFile) {
    if ($line -like "IDENTIFY_SERVICE_SECRET=*") {
      $identifySecret = $line.Substring("IDENTIFY_SERVICE_SECRET=".Length)
    }
  }
}
if (-not $identifySecret) {
  $buf2 = New-Object byte[] 24
  $rng2 = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
  $rng2.GetBytes($buf2)
  $rng2.Dispose()
  $identifySecret = -join ($buf2 | ForEach-Object { "{0:x2}" -f $_ })
}

$lines = @(
  "DATABASE_URL=postgresql+psycopg2://mushroomradar:${sqlPw}@${ip}:5432/mushroomradar?sslmode=require",
  "CLERK_ISSUER=https://wondrous-puma-85.clerk.accounts.dev",
  "CLERK_JWKS_URL=https://wondrous-puma-85.clerk.accounts.dev/.well-known/jwks.json",
  "GCS_USER_MEDIA_BUCKET=mushroom-radar-user-media",
  "GOOGLE_APPLICATION_CREDENTIALS=./gcp-sa.json",
  "IDENTIFY_SERVICE_SECRET=$identifySecret",
  "INATURALIST_API_TOKEN=",
  "INATURALIST_SCORE_URL=https://api.inaturalist.org/v1/computervision/score_image",
  "API_KEY="
)
Set-Content -Path $EnvFile -Value $lines -Encoding utf8
Write-Host "Updated backend/.env with a real database password. SQL IP: $ip"
