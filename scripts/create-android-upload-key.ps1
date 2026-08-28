param(
  [string]$Alias = "logospraxis-upload"
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$keytool = Join-Path $projectRoot ".toolchains\jdk-21\bin\keytool.exe"
$releaseRoot = Join-Path $projectRoot "release"
$keystorePath = Join-Path $releaseRoot "logospraxis-upload.jks"

if (-not (Test-Path -LiteralPath $keytool)) {
  throw "JDK 21 was not found. Run scripts\setup-android-toolchain.ps1 first."
}

if (Test-Path -LiteralPath $keystorePath) {
  throw "A keystore already exists at $keystorePath. It was not overwritten."
}

New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null

Write-Host "Creating the Google Play upload key at:"
Write-Host $keystorePath
Write-Host "Keytool will request a password. Keep that password and this file in separate secure backups."

& $keytool `
  -genkeypair `
  -v `
  -keystore $keystorePath `
  -alias $Alias `
  -keyalg RSA `
  -keysize 4096 `
  -validity 10000 `
  -dname "CN=LogosPraxis, OU=Mobile, O=LogosPraxis, L=Beijing, ST=Beijing, C=CN"

if ($LASTEXITCODE -ne 0) {
  throw "Keytool failed with exit code $LASTEXITCODE."
}

Write-Host ""
Write-Host "Upload key created. This file is ignored by Git:"
Write-Host $keystorePath
