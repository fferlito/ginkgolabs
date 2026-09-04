# Public Mushroompedia photo bucket. Safe to re-run.
$ErrorActionPreference = "Continue"
$Project = "mushroom-detector-450321"
$Bucket = "mushroom-radar-pedia"
$SaEmail = "mushroomradar-api@$Project.iam.gserviceaccount.com"
$CorsFile = Join-Path $PSScriptRoot "gcs-pedia-cors.json"

Write-Host "Ensuring public bucket gs://$Bucket ..."
gcloud storage buckets describe "gs://$Bucket" --project=$Project 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud storage buckets create "gs://$Bucket" `
    --project=$Project `
    --location=europe-west1 `
    --uniform-bucket-level-access `
    --no-public-access-prevention
  if ($LASTEXITCODE -ne 0) { throw "Failed to create gs://$Bucket" }
}

gcloud storage buckets update "gs://$Bucket" --cors-file=$CorsFile --project=$Project
if ($LASTEXITCODE -ne 0) { throw "Failed to set CORS on gs://$Bucket" }

gcloud storage buckets add-iam-policy-binding "gs://$Bucket" `
  --member="allUsers" `
  --role="roles/storage.objectViewer" `
  --project=$Project `
  --quiet
if ($LASTEXITCODE -ne 0) { throw "Failed to make gs://$Bucket public" }

gcloud storage buckets add-iam-policy-binding "gs://$Bucket" `
  --member="serviceAccount:$SaEmail" `
  --role="roles/storage.objectAdmin" `
  --project=$Project `
  --quiet | Out-Null

Write-Host "Public photos: https://storage.googleapis.com/$Bucket/<id>/mini.jpg"
