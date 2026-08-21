# This script starts the development environment.
# It assumes that you have Docker installed and running.
# start supaabase first, then frontend and backend in docker compose.

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $projectRoot
try {
  npx supabase@latest start
  docker compose up --build
}
finally {
  Pop-Location
}
