$ErrorActionPreference = 'Stop'

$app = Get-ChildItem release/win-unpacked -Filter *.exe -File |
  Where-Object { $_.Name -notmatch 'uninstaller' } |
  Select-Object -First 1
if (-not $app) { throw 'Could not find the packaged WoHo Browser executable for startup smoke testing.' }

$profileRoot = Join-Path $env:RUNNER_TEMP ('woho-browser-smoke-' + [guid]::NewGuid().ToString('N'))
$originalAppData = $env:APPDATA
$originalSmokeFlag = $env:WOHO_BROWSER_SMOKE_TEST
New-Item -ItemType Directory -Path $profileRoot -Force | Out-Null
$process = $null

try {
  # Isolate the packaged app from any profile data on the runner.
  $env:APPDATA = $profileRoot
  $env:WOHO_BROWSER_SMOKE_TEST = '1'
  $process = Start-Process -FilePath $app.FullName -PassThru

  $deadline = (Get-Date).AddSeconds(30)
  while (-not $process.HasExited -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 250
    $process.Refresh()
  }

  if (-not $process.HasExited) {
    throw 'Packaged app did not complete its startup smoke test within 30 seconds.'
  }
  if ($process.ExitCode -ne 0) {
    throw "Packaged app startup smoke test exited with code $($process.ExitCode)."
  }
  Write-Host 'Packaged app startup smoke test passed: main renderer loaded and initial tab navigation started.'
}
finally {
  if ($process -and -not $process.HasExited) {
    & taskkill.exe /PID $process.Id /T /F | Out-Null
  }
  if ($null -eq $originalAppData) {
    Remove-Item Env:APPDATA -ErrorAction SilentlyContinue
  } else {
    $env:APPDATA = $originalAppData
  }
  if ($null -eq $originalSmokeFlag) {
    Remove-Item Env:WOHO_BROWSER_SMOKE_TEST -ErrorAction SilentlyContinue
  } else {
    $env:WOHO_BROWSER_SMOKE_TEST = $originalSmokeFlag
  }
  Remove-Item -LiteralPath $profileRoot -Recurse -Force -ErrorAction SilentlyContinue
}
