param(
  [switch]$SkipLicensePrompt
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$toolchainsRoot = Join-Path $projectRoot ".toolchains"
$javaHome = Join-Path $toolchainsRoot "jdk-21"
$androidSdk = Join-Path $toolchainsRoot "android-sdk"
$androidUserHome = Join-Path $toolchainsRoot "android-user-home"
$downloadRoot = Join-Path $toolchainsRoot "downloads"
$commandLineZip = Join-Path $downloadRoot "commandlinetools-win-15859902_latest.zip"
$jdkZip = Join-Path $downloadRoot "temurin-jdk-21.zip"
$commandLineSha256 = "90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a"

function Get-RemoteFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [Parameter(Mandatory = $true)]
    [string]$Destination
  )

  & curl.exe `
    --fail `
    --location `
    --retry 3 `
    --retry-delay 2 `
    --output $Destination `
    $Uri

  if ($LASTEXITCODE -ne 0) {
    throw "Download failed with exit code ${LASTEXITCODE}: $Uri"
  }
}

if (-not $SkipLicensePrompt) {
  Write-Host "This script downloads Eclipse Temurin JDK 21 and Android SDK tools into this project."
  Write-Host "Continuing means that you accept the Android SDK License and relevant open-source licenses."
  $answer = Read-Host "Type YES to continue"
  if ($answer -ne "YES") {
    throw "License confirmation was not provided. Installation cancelled."
  }
}

New-Item -ItemType Directory -Path $toolchainsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $downloadRoot -Force | Out-Null
New-Item -ItemType Directory -Path $androidSdk -Force | Out-Null
New-Item -ItemType Directory -Path $androidUserHome -Force | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $javaHome "bin\java.exe"))) {
  Write-Host "Downloading Eclipse Temurin JDK 21..."
  Get-RemoteFile `
    -Uri "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk" `
    -Destination $jdkZip
  $jdkExtract = Join-Path $toolchainsRoot "jdk-extract"
  New-Item -ItemType Directory -Path $jdkExtract -Force | Out-Null
  Expand-Archive -LiteralPath $jdkZip -DestinationPath $jdkExtract -Force
  $jdkSource = Get-ChildItem -LiteralPath $jdkExtract -Directory |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "bin\java.exe") } |
    Select-Object -First 1
  if (-not $jdkSource) {
    throw "The JDK archive does not contain bin\java.exe."
  }
  Move-Item -LiteralPath $jdkSource.FullName -Destination $javaHome
}

if (-not (Test-Path -LiteralPath (Join-Path $androidSdk "cmdline-tools\latest\bin\sdkmanager.bat"))) {
  Write-Host "Downloading Android SDK command-line tools..."
  Get-RemoteFile `
    -Uri "https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip" `
    -Destination $commandLineZip
  $actualHash = (Get-FileHash -LiteralPath $commandLineZip -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualHash -ne $commandLineSha256) {
    throw "Android command-line tools checksum mismatch. Expected $commandLineSha256, got $actualHash."
  }
  $toolsExtract = Join-Path $toolchainsRoot "cmdline-tools-extract"
  New-Item -ItemType Directory -Path $toolsExtract -Force | Out-Null
  Expand-Archive -LiteralPath $commandLineZip -DestinationPath $toolsExtract -Force
  $latestRoot = Join-Path $androidSdk "cmdline-tools\latest"
  New-Item -ItemType Directory -Path $latestRoot -Force | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $toolsExtract "cmdline-tools") -Force |
    Move-Item -Destination $latestRoot
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:ANDROID_USER_HOME = $androidUserHome
$env:Path = "$(Join-Path $javaHome 'bin');$(Join-Path $androidSdk 'platform-tools');$env:Path"
$sdkManager = Join-Path $androidSdk "cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "Accepting Android SDK component licenses..."
$licenseAnswers = (1..20 | ForEach-Object { "y" }) -join [Environment]::NewLine
$licenseAnswers | & $sdkManager --sdk_root=$androidSdk --licenses | Out-Host

Write-Host "Installing Android API 36, Build Tools 35/36, and Platform Tools..."
& $sdkManager `
  --sdk_root=$androidSdk `
  "platform-tools" `
  "platforms;android-36" `
  "build-tools;35.0.0" `
  "build-tools;36.0.0"

if ($LASTEXITCODE -ne 0) {
  throw "Android SDK component installation failed with exit code $LASTEXITCODE."
}

Write-Host ""
Write-Host "Android toolchain installed at: $toolchainsRoot"
& (Join-Path $javaHome "bin\java.exe") -version
& (Join-Path $androidSdk "platform-tools\adb.exe") version
