# Lumina Library — batch convert books in public/books/ to plain text.
#
# Requirements:
#   - Calibre installed (https://calibre-ebook.com/download_windows)
#   - ebook-convert.exe available in PATH, or set $CalibreBin below.
#
# Output: public/books-text/<original-name>.txt (UTF-8)
# These .txt files are intended to feed content authoring; they are NOT
# consumed by the app at runtime.

$ErrorActionPreference = 'Stop'

# If ebook-convert isn't on PATH, set the full path here:
$CalibreBin = ''  # e.g. 'C:\Program Files\Calibre2\ebook-convert.exe'

$projectRoot = Split-Path -Parent $PSScriptRoot
$inputDir    = Join-Path $projectRoot 'public\books'
$outputDir   = Join-Path $projectRoot 'public\books-text'

if (-not (Test-Path $inputDir)) {
  Write-Error "Input directory not found: $inputDir"
}

if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$converter = if ($CalibreBin) { $CalibreBin } else { 'ebook-convert' }

# Probe that ebook-convert is reachable
try {
  & $converter --version | Out-Null
  if (-not $?) { throw 'ebook-convert exited non-zero on --version.' }
} catch {
  Write-Error @"
Could not run '$converter'.
Install Calibre (https://calibre-ebook.com/download_windows) and either:
  - add its install dir to PATH, or
  - set `$CalibreBin at the top of this script to the full path of ebook-convert.exe.
"@
}

$files = Get-ChildItem -Path $inputDir -File |
         Where-Object { $_.Extension -match '^\.(pdf|epub|mobi|azw3?|djvu)$' }

if ($files.Count -eq 0) {
  Write-Host "No convertible books found in $inputDir."
  exit 0
}

$converted = 0
$skipped   = 0
$failed    = 0

foreach ($file in $files) {
  $base   = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
  $target = Join-Path $outputDir ($base + '.txt')

  if (Test-Path $target) {
    Write-Host "[skip] $($file.Name) — already converted."
    $skipped++
    continue
  }

  Write-Host "[convert] $($file.Name) -> $([System.IO.Path]::GetFileName($target))"
  try {
    & $converter $file.FullName $target --enable-heuristics 2>&1 |
      ForEach-Object { if ($_ -match '^(Input|Output|Converting|Rendering)') { "  $_" } } |
      Write-Host
    if ($LASTEXITCODE -ne 0) { throw "ebook-convert exit code $LASTEXITCODE." }
    $converted++
  } catch {
    Write-Warning "  Failed: $($_.Exception.Message)"
    $failed++
  }
}

Write-Host ''
Write-Host "Done. Converted: $converted, Skipped: $skipped, Failed: $failed."
Write-Host "Output: $outputDir"
