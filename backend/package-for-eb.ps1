# Creates rideflow-api-eb.zip at repo root for Elastic Beanstalk "Upload and deploy".
# Run from this folder:  .\package-for-eb.ps1
$backendRoot = $PSScriptRoot
$repoRoot = Split-Path $backendRoot -Parent
$zipPath = Join-Path $repoRoot "rideflow-api-eb.zip"
$tempRoot = Join-Path $env:TEMP ("rideflow-eb-" + [guid]::NewGuid().ToString("n"))

New-Item -ItemType Directory -Path $tempRoot | Out-Null
try {
  robocopy $backendRoot $tempRoot /E /XD node_modules .git logs coverage dist build `
    /XF .env .env.* *.log npm-debug.log* yarn-debug.log* yarn-error.log* `
    /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  if ($LASTEXITCODE -ge 8) {
    throw "robocopy failed with exit code $LASTEXITCODE"
  }
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  Compress-Archive -Path (Join-Path $tempRoot '*') -DestinationPath $zipPath -Force
  Write-Host "Created $zipPath"
}
finally {
  if (Test-Path $tempRoot) { Remove-Item $tempRoot -Recurse -Force }
}
