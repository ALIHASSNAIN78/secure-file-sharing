# Run once after git clone — creates .env (not on GitHub)
Set-Location $PSScriptRoot
node scripts/init-env.js
if ($LASTEXITCODE -ne 0) {
  Write-Host "Node.js required, or use: docker compose up --build (works without .env)"
  exit 1
}
