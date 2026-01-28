#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

$RULE_NAME = "Block_DBD_Dublin_eu-west-1"

function Write-ColorOutput($ForegroundColor, $Message) {
    Write-Host $Message -ForegroundColor $ForegroundColor
}

Write-ColorOutput Cyan "=========================================="
Write-ColorOutput Cyan "Dead by Daylight - Unblock Dublin Servers"
Write-ColorOutput Cyan "=========================================="

Write-ColorOutput Yellow "`nSearching for firewall rule..."

$existingRules = Get-NetFirewallRule -DisplayName $RULE_NAME -ErrorAction SilentlyContinue

if ($existingRules) {
    Write-ColorOutput Yellow "Found firewall rule. Removing..."
    Remove-NetFirewallRule -DisplayName $RULE_NAME
    Write-ColorOutput Green "`n[OK] Firewall rule removed successfully!"
    Write-ColorOutput Green "Dublin (eu-west-1) servers are now UNBLOCKED for Dead by Daylight."
} else {
    Write-ColorOutput Yellow "`nNo firewall rule found with name: $RULE_NAME"
    Write-ColorOutput Green "Nothing to remove. Dublin servers are already unblocked."
}

Write-ColorOutput Green "`n=========================================="
Write-ColorOutput Green "Operation completed!"
Write-ColorOutput Green "=========================================="

Read-Host "`nPress Enter to exit"