#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

$RULE_NAME = "Block_DBD_Dublin_eu-west-1"
$IP_FILE_PATH = "C:\Users\steaxs\Desktop\M\block\eu-west-1.txt"

function Write-ColorOutput($ForegroundColor, $Message) {
    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Convert-CIDRToSubnetMask {
    param([string]$CIDR)

    if ($CIDR -match '^(.+)/(\d+)$') {
        $ip = $matches[1]
        $prefix = [int]$matches[2]

        # /32 addresses are stored without mask in Windows Firewall
        if ($prefix -eq 32) {
            return $ip
        }

        $mask = ([Math]::Pow(2, $prefix) - 1) * [Math]::Pow(2, (32 - $prefix))
        $maskBytes = [BitConverter]::GetBytes([UInt32]$mask)
        [Array]::Reverse($maskBytes)
        $subnetMask = ($maskBytes | ForEach-Object { $_ }) -join '.'

        return "$ip/$subnetMask"
    }
    return $CIDR
}

Write-ColorOutput Cyan "=========================================="
Write-ColorOutput Cyan "Dead by Daylight - Verify Block Status"
Write-ColorOutput Cyan "=========================================="

Write-ColorOutput Yellow "`nLoading IP addresses from file..."

if (-not (Test-Path $IP_FILE_PATH)) {
    Write-ColorOutput Red "ERROR: IP file not found at: $IP_FILE_PATH"
    Read-Host "`nPress Enter to exit"
    exit 1
}

$allIPs = Get-Content $IP_FILE_PATH | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
$ipv4IPs = @($allIPs | Where-Object { $_ -notmatch ":" })
$ipv6Count = ($allIPs | Where-Object { $_ -match ":" }).Count

# Convert CIDR to subnet mask notation for comparison with firewall
$expectedIPs = @($ipv4IPs | ForEach-Object { Convert-CIDRToSubnetMask $_ })

Write-ColorOutput Green "Loaded $($ipv4IPs.Count) IPv4 addresses/ranges."
if ($ipv6Count -gt 0) {
    Write-ColorOutput Yellow "Skipped $ipv6Count IPv6 addresses."
}

Write-ColorOutput Yellow "`nChecking firewall rule..."

try {
    $rule = Get-NetFirewallRule -DisplayName $RULE_NAME -ErrorAction Stop
    $addressFilter = $rule | Get-NetFirewallAddressFilter
    
    $configuredIPs = $addressFilter.RemoteAddress
    
    Write-ColorOutput Cyan "`nFirewall Rule Details:"
    Write-ColorOutput Cyan "======================"
    Write-ColorOutput Green "Rule Name: $($rule.DisplayName)"
    Write-ColorOutput Green "Status: $($rule.Enabled)"
    Write-ColorOutput Green "Action: $($rule.Action)"
    Write-ColorOutput Green "Direction: $($rule.Direction)"
    Write-ColorOutput Green "Profile: $($rule.Profile)"
    
    Write-ColorOutput Cyan "`nIP Address Verification:"
    Write-ColorOutput Cyan "========================"
    Write-ColorOutput Green "Expected IPv4 IPs: $($expectedIPs.Count)"
    Write-ColorOutput Green "Configured IPs in rule: $($configuredIPs.Count)"
    
    $missingIPs = @()
    foreach ($ip in $expectedIPs) {
        if ($ip -notin $configuredIPs) {
            $missingIPs += $ip
        }
    }
    
    $extraIPs = @()
    foreach ($ip in $configuredIPs) {
        if ($ip -notin $expectedIPs) {
            $extraIPs += $ip
        }
    }
    
    if ($missingIPs.Count -eq 0 -and $extraIPs.Count -eq 0) {
        Write-ColorOutput Green "`n[OK][OK][OK] PERFECT MATCH! [OK][OK][OK]"
        Write-ColorOutput Green "ALL $($expectedIPs.Count) IP ADDRESSES ARE BLOCKED CORRECTLY!"
    } else {
        if ($missingIPs.Count -gt 0) {
            Write-ColorOutput Red "`n[WARNING] $($missingIPs.Count) IP addresses are MISSING from the rule!"
            Write-ColorOutput Yellow "`nMissing IPs (first 10):"
            $missingIPs | Select-Object -First 10 | ForEach-Object { Write-ColorOutput Yellow "  - $_" }
            if ($missingIPs.Count -gt 10) {
                Write-ColorOutput Yellow "  ... and $($missingIPs.Count - 10) more"
            }
        }
        
        if ($extraIPs.Count -gt 0) {
            Write-ColorOutput Yellow "`n[INFO] $($extraIPs.Count) extra IP addresses found in rule that are NOT in the file."
            Write-ColorOutput Yellow "`nExtra IPs (first 10):"
            $extraIPs | Select-Object -First 10 | ForEach-Object { Write-ColorOutput Yellow "  - $_" }
            if ($extraIPs.Count -gt 10) {
                Write-ColorOutput Yellow "  ... and $($extraIPs.Count - 10) more"
            }
        }
    }
    
} catch {
    Write-ColorOutput Red "`n[NOT FOUND] Firewall rule does not exist!"
    Write-ColorOutput Yellow "The rule '$RULE_NAME' does not exist."
    Write-ColorOutput Yellow "Dublin servers are currently NOT blocked."
}

Write-ColorOutput Green "`n=========================================="
Write-ColorOutput Green "Verification completed!"
Write-ColorOutput Green "=========================================="

Read-Host "`nPress Enter to exit"