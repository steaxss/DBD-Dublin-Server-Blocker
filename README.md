# DBD Dublin Server Blocker

Block AWS eu-west-1 (Dublin) servers for Dead by Daylight using Windows Firewall.

## Why?

Some players experience better ping or prefer to avoid certain regional servers. This tool blocks Dublin datacenter IPs, forcing the game to connect to other regions.

## Files

| File | Description |
|------|-------------|
| `Block-DBD-Dublin.ps1` | Creates firewall rule to block Dublin servers |
| `Unblock-DBD-Dublin.ps1` | Removes the firewall rule |
| `Verify-DBD-Dublin-Block.ps1` | Checks if the rule is active and configured correctly |
| `eu-west-1.txt` | AWS eu-west-1 IP ranges (320 IPv4 + 73 IPv6) |

## Requirements

- Windows 10/11
- Administrator privileges
- PowerShell 5.1+

## Usage

### Block Dublin Servers

```powershell
.\Block-DBD-Dublin.ps1
```

### Unblock Dublin Servers

```powershell
.\Unblock-DBD-Dublin.ps1
```

### Verify Status

```powershell
.\Verify-DBD-Dublin-Block.ps1
```

**Tip:** Right-click the script and select "Run with PowerShell" for quick execution.

## How It Works

The script creates an outbound firewall rule that blocks connections from `DeadByDaylight-Win64-Shipping.exe` to 320 IPv4 CIDR ranges covering AWS eu-west-1 infrastructure.

**Firewall Rule Details:**
- **Name:** `Block_DBD_Dublin_eu-west-1`
- **Direction:** Outbound
- **Action:** Block
- **Protocol:** Any
- **Scope:** Dead by Daylight executable only

## Configuration

Edit the paths in the scripts if your installation differs:

```powershell
$IP_FILE_PATH = "C:\Users\steaxs\Desktop\M\block\eu-west-1.txt"
$DBD_EXE_PATH = "C:\Program Files (x86)\Steam\steamapps\common\Dead by Daylight\DeadByDaylight\Binaries\Win64\DeadByDaylight-Win64-Shipping.exe"
```

## Troubleshooting

### Script execution is disabled

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Can't find any games

That's expected! Dublin servers are blocked. Run `Unblock-DBD-Dublin.ps1` to restore access.

## Manual Verification

Open "Windows Defender Firewall with Advanced Security" > Outbound Rules > Look for `Block_DBD_Dublin_eu-west-1`

## License

MIT
