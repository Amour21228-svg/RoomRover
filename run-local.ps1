param([string]$mode = "node")

# Helper PowerShell script to start the project locally.
# Usage: .\run-local.ps1 node   OR  .\run-local.ps1 python

if ($mode -eq "node") {
    Write-Host "Installing Node dependencies (si nécessaire)..."
    npm install
    Write-Host "Lancement du serveur Node (http://localhost:8080)..."
    npm run start
} elseif ($mode -eq "python") {
    Write-Host "Démarrage d'un serveur HTTP Python (http://localhost:8080)..."
    py -3 -m http.server 8080
} else {
    Write-Host "Usage: .\run-local.ps1 [node|python]"
}
