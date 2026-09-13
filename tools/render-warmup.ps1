param(
  [Parameter(Mandatory = $true)]
  [string]$HealthUrl
)

$ErrorActionPreference = 'Stop'
try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -Method Get -TimeoutSec 25
  if ($response.StatusCode -ne 200) { throw "Health endpoint returned HTTP $($response.StatusCode)" }
  Write-Output "Render warm-up succeeded: $HealthUrl"
} catch {
  Write-Error "Render warm-up failed for $HealthUrl. $($_.Exception.Message)"
  exit 1
}
