# Non-secret GCP bootstrap. Writes secrets only to backend/.env (gitignored).
$ErrorActionPreference = "Continue"
$Project = "mushroom-detector-450321"
$Backend = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Backend ".env"
$KeyFile = Join-Path $Backend "gcp-sa.json"

function New-SecretHex([int]$Bytes = 24) {
  $buf = New-Object byte[] $Bytes
  $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
  $rng.GetBytes($buf)
  $rng.Dispose()
  return -join ($buf | ForEach-Object { "{0:x2}" -f $_ })
}

function Invoke-Gcloud {
  & gcloud @args | Out-Null
  return $LASTEXITCODE -eq 0
}

Write-Host "Enabling extra APIs..."
gcloud services enable artifactregistry.googleapis.com iamcredentials.googleapis.com --project=$Project --quiet
if ($LASTEXITCODE -ne 0) { throw "Failed to enable APIs" }

$bucket = "mushroom-radar-user-media"
Write-Host "Ensuring GCS bucket gs://$bucket ..."
if (-not (Invoke-Gcloud storage buckets describe "gs://$bucket" --project=$Project)) {
  gcloud storage buckets create "gs://$bucket" --project=$Project --location=europe-west1 --uniform-bucket-level-access
  if ($LASTEXITCODE -ne 0) { throw "Failed to create bucket" }
}

$saId = "mushroomradar-api"
$saEmail = "$saId@$Project.iam.gserviceaccount.com"
Write-Host "Ensuring service account $saEmail ..."
if (-not (Invoke-Gcloud iam service-accounts describe $saEmail --project=$Project)) {
  gcloud iam service-accounts create $saId --display-name="MushroomRadar API" --project=$Project
  if ($LASTEXITCODE -ne 0) { throw "Failed to create service account" }
}
gcloud storage buckets add-iam-policy-binding "gs://$bucket" --member="serviceAccount:$saEmail" --role="roles/storage.objectAdmin" --project=$Project --quiet | Out-Null

if (-not (Test-Path $KeyFile)) {
  Write-Host "Creating signing key file (not printed)..."
  gcloud iam service-accounts keys create $KeyFile --iam-account=$saEmail --project=$Project
  if ($LASTEXITCODE -ne 0) { throw "Failed to create service account key. Org policy may block keys." }
}

Write-Host "Ensuring Cloud SQL instance mushroomradar (this can take several minutes)..."
$instanceExists = Invoke-Gcloud sql instances describe mushroomradar --project=$Project --format="value(state)"
$sqlPw = New-SecretHex 24
$identifySecret = New-SecretHex 24

if (-not $instanceExists) {
  gcloud sql instances create mushroomradar `
    --project=$Project `
    --database-version=POSTGRES_16 `
    --edition=enterprise `
    --tier=db-f1-micro `
    --region=europe-west1 `
    --storage-size=10 `
    --storage-auto-increase `
    --availability-type=ZONAL `
    --assign-ip `
    --authorized-networks=0.0.0.0/0 `
    --root-password=$sqlPw `
    --quiet
  if ($LASTEXITCODE -ne 0) { throw "Failed to create Cloud SQL instance" }
} else {
  Write-Host "Instance already exists; rotating app user password into backend/.env."
}

Write-Host "Waiting for RUNNABLE..."
$state = ""
for ($i = 0; $i -lt 40; $i++) {
  $state = (gcloud sql instances describe mushroomradar --project=$Project --format="value(state)")
  if ($state -eq "RUNNABLE") { break }
  Start-Sleep -Seconds 15
}
if ($state -ne "RUNNABLE") { throw "Cloud SQL instance not RUNNABLE (state=$state)" }

Invoke-Gcloud sql databases create mushroomradar --instance=mushroomradar --project=$Project | Out-Null
if (-not (Invoke-Gcloud sql users create mushroomradar --instance=mushroomradar --password=$sqlPw --project=$Project)) {
  gcloud sql users set-password mushroomradar --instance=mushroomradar --password=$sqlPw --project=$Project | Out-Null
}

$ip = gcloud sql instances describe mushroomradar --project=$Project --format="value(ipAddresses[0].ipAddress)"
$lines = @(
  "DATABASE_URL=postgresql+psycopg2://mushroomradar:${sqlPw}@${ip}:5432/mushroomradar?sslmode=require",
  "CLERK_ISSUER=https://wondrous-puma-85.clerk.accounts.dev",
  "CLERK_JWKS_URL=https://wondrous-puma-85.clerk.accounts.dev/.well-known/jwks.json",
  "GCS_USER_MEDIA_BUCKET=$bucket",
  "GOOGLE_APPLICATION_CREDENTIALS=./gcp-sa.json",
  "IDENTIFY_SERVICE_SECRET=$identifySecret",
  "INATURALIST_API_TOKEN=",
  "INATURALIST_SCORE_URL=https://api.inaturalist.org/v1/computervision/score_image",
  "API_KEY="
)
Set-Content -Path $EnvFile -Value $lines -Encoding utf8
Write-Host "Wrote gitignored backend/.env. Cloud SQL public IP: $ip"
Write-Host "Set the same DATABASE_URL, GCS_SERVICE_ACCOUNT_JSON, and CLERK_* on Railway."
Write-Host "Add INATURALIST_API_TOKEN from https://www.inaturalist.org/users/api_token then redeploy identify."
