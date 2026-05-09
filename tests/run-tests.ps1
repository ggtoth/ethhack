$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root ".test-dist"
$aliasRoot = Join-Path $dist "node_modules\@"
$aliasLib = Join-Path $aliasRoot "lib"
$swarmPackageRoot = Join-Path $dist "node_modules\swarm-verified-fetch"

if (Test-Path $dist) {
  try {
    Remove-Item -LiteralPath $dist -Recurse -Force -ErrorAction Stop
  } catch {
    if (
      $_.Exception -isnot [System.IO.DirectoryNotFoundException] -and
      $_.Exception.Message -notmatch "cannot find|Could not find"
    ) {
      throw
    }
  }
}

Push-Location $root
try {
  npx tsc -p tsconfig.test.json
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  New-Item -ItemType Directory -Force -Path $aliasRoot | Out-Null
  New-Item -ItemType Directory -Force -Path $swarmPackageRoot | Out-Null
  Set-Content -LiteralPath (Join-Path $dist "package.json") -Value '{ "type": "commonjs" }'
  Copy-Item -LiteralPath (Join-Path $dist "lib") -Destination $aliasLib -Recurse
  Copy-Item -LiteralPath (Join-Path $dist "packages\swarm-verified-fetch\src") -Destination (Join-Path $swarmPackageRoot "src") -Recurse
  Set-Content -LiteralPath (Join-Path $swarmPackageRoot "package.json") -Value '{ "name": "swarm-verified-fetch", "type": "commonjs", "main": "./src/index.js" }'

  $testFiles = Get-ChildItem -LiteralPath $dist -Recurse -Filter "*.test.js" |
    ForEach-Object { $_.FullName }

  node --test $testFiles
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
