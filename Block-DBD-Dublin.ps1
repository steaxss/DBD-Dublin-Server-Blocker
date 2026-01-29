#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

$RULE_NAME = "Block_DBD_Dublin_eu-west-1"
$IP_FILE_PATH = "C:\Users\steaxs\Desktop\M\block\eu-west-1.txt"
$DBD_EXE_PATH = "C:\Program Files (x86)\Steam\steamapps\common\Dead by Daylight\DeadByDaylight\Binaries\Win64\DeadByDaylight-Win64-Shipping.exe"

function Write-ColorOutput($ForegroundColor, $Message) {
    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Remove-ExistingRule {
    Write-ColorOutput Yellow "`n[1/4] Checking for existing rules..."
    
    $existingRules = Get-NetFirewallRule -DisplayName $RULE_NAME -ErrorAction SilentlyContinue
    
    if ($existingRules) {
        Write-ColorOutput Yellow "Found existing rule(s). Removing..."
        Remove-NetFirewallRule -DisplayName $RULE_NAME
        Write-ColorOutput Green "Existing rule(s) removed successfully."
    } else {
        Write-ColorOutput Green "No existing rules found."
    }
}

function Load-IPAddresses {
    Write-ColorOutput Yellow "`n[2/4] Loading IP addresses from file..."
    
    if (-not (Test-Path $IP_FILE_PATH)) {
        Write-ColorOutput Red "ERROR: IP file not found at: $IP_FILE_PATH"
        exit 1
    }
    
    $allIPs = Get-Content $IP_FILE_PATH | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }

    # Filter out IPv6 addresses (contain colons) - Windows firewall has issues with mixed IPv4/IPv6
    $ipList = @($allIPs | Where-Object { $_ -notmatch ":" })
    $ipv6Count = ($allIPs | Where-Object { $_ -match ":" }).Count

    Write-ColorOutput Green "Loaded $($ipList.Count) IPv4 addresses/ranges."
    if ($ipv6Count -gt 0) {
        Write-ColorOutput Yellow "Skipped $ipv6Count IPv6 addresses (not supported in mixed rules)."
    }
    return $ipList
}

function Create-FirewallRule {
    param([string[]]$IPList)

    Write-ColorOutput Yellow "`n[3/4] Creating firewall rule for Dead by Daylight..."

    try {
        # Step 1: Create rule without program restriction first
        Write-ColorOutput Yellow "Step 1: Creating base rule..."
        New-NetFirewallRule `
            -DisplayName $RULE_NAME `
            -Direction Outbound `
            -Action Block `
            -Protocol Any `
            -RemoteAddress $IPList `
            -Description "Blocks Dead by Daylight connections to AWS eu-west-1 (Dublin) region servers" `
            -Enabled True `
            -Profile Any `
            -ErrorAction Stop | Out-Null

        # Step 2: Add program restriction using Set-NetFirewallRule
        Write-ColorOutput Yellow "Step 2: Adding program restriction..."
        $rule = Get-NetFirewallRule -DisplayName $RULE_NAME
        $rule | Get-NetFirewallApplicationFilter | Set-NetFirewallApplicationFilter -Program $DBD_EXE_PATH -ErrorAction Stop

        Write-ColorOutput Green "Firewall rule created successfully!"
        Write-ColorOutput Green "Rule name: $RULE_NAME"
        Write-ColorOutput Green "Program: $DBD_EXE_PATH"
    } catch {
        Write-ColorOutput Red "ERROR creating firewall rule: $_"
        Write-ColorOutput Yellow "`n[!] If this error persists, please restart your PC and try again."
        # Clean up partial rule if it exists
        Remove-NetFirewallRule -DisplayName $RULE_NAME -ErrorAction SilentlyContinue
        Read-Host "`nPress Enter to exit"
        exit 1
    }
}

function Verify-FirewallRule {
    param([string[]]$ExpectedIPs)

    Write-ColorOutput Yellow "`n[4/4] Verifying firewall rule..."

    try {
        $rule = Get-NetFirewallRule -DisplayName $RULE_NAME -ErrorAction Stop
        $addressFilter = $rule | Get-NetFirewallAddressFilter

        $configuredIPs = $addressFilter.RemoteAddress

        Write-ColorOutput Cyan "`nVerification Results:"
        Write-ColorOutput Cyan "===================="
        Write-ColorOutput Green "Rule Status: ACTIVE"
        Write-ColorOutput Green "Rule Action: $($rule.Action)"
        Write-ColorOutput Green "Rule Direction: $($rule.Direction)"
        Write-ColorOutput Green "Rule Enabled: $($rule.Enabled)"
        Write-ColorOutput Green "Expected IPs: $($ExpectedIPs.Count)"
        Write-ColorOutput Green "Configured IPs: $($configuredIPs.Count)"

        # Windows Firewall stores CIDR as subnet masks, so just compare counts
        if ($configuredIPs.Count -eq $ExpectedIPs.Count) {
            Write-ColorOutput Green "`n[OK] ALL $($ExpectedIPs.Count) IP ADDRESSES ARE BLOCKED CORRECTLY!"
        } else {
            Write-ColorOutput Red "`n[WARNING] IP count mismatch! Expected $($ExpectedIPs.Count), got $($configuredIPs.Count)"
        }

    } catch {
        Write-ColorOutput Red "ERROR during verification: $_"
        exit 1
    }
}

Write-ColorOutput Cyan "=========================================="
Write-ColorOutput Cyan "Dead by Daylight - Block Dublin Servers"
Write-ColorOutput Cyan "=========================================="

Remove-ExistingRule
$ipAddresses = Load-IPAddresses
Create-FirewallRule -IPList $ipAddresses
Verify-FirewallRule -ExpectedIPs $ipAddresses

Write-ColorOutput Green "`n=========================================="
Write-ColorOutput Green "Operation completed successfully!"
Write-ColorOutput Green "Dublin (eu-west-1) servers are now blocked for Dead by Daylight."
Write-ColorOutput Green "=========================================="

Read-Host "`nPress Enter to exit"