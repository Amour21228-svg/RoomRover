# Test simple de l'API mock
# Usage: .\test-api.ps1

try {
    $response = Invoke-RestMethod http://localhost:8080/api/properties -ErrorAction Stop
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Erreur lors de l'appel API : $_" -ForegroundColor Red
}
