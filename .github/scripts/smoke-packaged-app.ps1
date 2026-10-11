$ErrorActionPreference = 'Stop'

$app = Get-ChildItem release/win-unpacked -Filter *.exe -File |
  Where-Object { $_.Name -notmatch 'uninstaller' } |
  Select-Object -First 1
if (-not $app) { throw 'Could not find the packaged WoHo Browser executable for startup smoke testing.' }

$asarPath = Join-Path $app.DirectoryName 'resources/app.asar'
$asarCli = Join-Path (Get-Location) 'node_modules/@electron/asar/bin/asar.js'
if (-not (Test-Path -LiteralPath $asarPath)) { throw 'Packaged app.asar is missing.' }
if (-not (Test-Path -LiteralPath $asarCli)) { throw 'The @electron/asar inspection CLI is missing.' }
$asarEntries = & node $asarCli list $asarPath
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the packaged app.asar archive.' }
$normalizedEntries = @($asarEntries | ForEach-Object { ($_ -replace '\\', '/').TrimStart('/') })
foreach ($requiredEntry in @('out/main/index.js', 'out/preload/index.js', 'out/renderer/index.html')) {
  if ($normalizedEntries -notcontains $requiredEntry) {
    throw "Packaged app.asar is missing required application entry: $requiredEntry"
  }
}
Write-Host ("Verified renderer-related ASAR entries: " + (($normalizedEntries | Where-Object { $_ -like 'out/renderer/*' }) -join ', '))
$extractRoot = Join-Path $env:RUNNER_TEMP ('woho-browser-asar-' + [guid]::NewGuid().ToString('N'))
& node $asarCli extract $asarPath $extractRoot
if ($LASTEXITCODE -ne 0) { throw 'Could not extract the packaged ASAR archive for validation.' }
$rendererPath = Join-Path $extractRoot 'out/renderer/index.html'
if (-not (Test-Path -LiteralPath $rendererPath)) { throw 'Extracted ASAR does not contain the renderer HTML at the expected path.' }
$rendererHtml = Get-Content -LiteralPath $rendererPath -Raw
if (-not $rendererHtml.Contains('<!doctype html>')) { throw 'Extracted renderer entry is not valid HTML.' }
Write-Host ("Extracted packaged renderer HTML: " + $rendererHtml.Length + " characters.")

$profileRoot = Join-Path $env:RUNNER_TEMP ('woho-browser-smoke-' + [guid]::NewGuid().ToString('N'))
$originalAppData = $env:APPDATA
$originalSmokeFlag = $env:WOHO_BROWSER_SMOKE_TEST
New-Item -ItemType Directory -Path $profileRoot -Force | Out-Null
$process = $null

try {
  # Isolate the packaged app from any profile data on the runner.
  $env:APPDATA = $profileRoot
  $env:WOHO_BROWSER_SMOKE_TEST = '1'
  $stdoutPath = Join-Path $profileRoot 'stdout.log'
  $stderrPath = Join-Path $profileRoot 'stderr.log'
  $process = Start-Process -FilePath $app.FullName -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

  $deadline = (Get-Date).AddSeconds(30)
  while (-not $process.HasExited -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 250
    $process.Refresh()
  }

  if (-not $process.HasExited) {
    throw 'Packaged app did not complete its startup smoke test within 30 seconds.'
  }
  if ($process.ExitCode -ne 0) {
    foreach ($logPath in @($stdoutPath, $stderrPath)) {
      if (Test-Path -LiteralPath $logPath) {
        $logContents = Get-Content -LiteralPath $logPath -Raw
        if ($logContents) { Write-Host "Packaged app diagnostic ($([IO.Path]::GetFileName($logPath))):"; Write-Host $logContents }
      }
    }
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
