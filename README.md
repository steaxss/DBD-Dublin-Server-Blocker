# DBD Server Blocker

An Electron app that lets you block Dead by Daylight from connecting to specific AWS regions via Windows Firewall. Rules target the DBD executable directly — no global network impact.

![screenshot placeholder](resources/icon.png)

## Features

- Block / unblock individual AWS regions with one click
- **Permanent mode** — rules survive app restarts
- **Exclusive mode** — allow only one region, block all others
- Live ping display per region
- Auto-fetches latest AWS IP ranges on startup
- System tray integration

## Requirements

- Windows 10/11
- Administrator privileges (required for firewall rules)
- Node.js 18+ (for development)

## Usage

Download the latest release from the [Releases](../../releases) page and run the installer. The app requires admin privileges to manage firewall rules.

## Development

```bash
npm install
npm run dev      # start in dev mode
npm run build    # build distributable
```

## How It Works

The app fetches AWS IP ranges from the official AWS endpoint and creates outbound Windows Firewall rules scoped to `DeadByDaylight-Win64-Shipping.exe`. Only traffic from the game is affected.

**Rule naming:** `Block_DBD_{regionId}_{city}` (e.g. `Block_DBD_eu-west-1_Dublin`)

## AWS Regions Covered

| Region | Location |
|---|---|
| us-east-1 | N. Virginia |
| us-east-2 | Ohio |
| us-west-1 | N. California |
| us-west-2 | Oregon |
| ca-central-1 | Canada |
| eu-central-1 | Frankfurt |
| eu-west-1 | Dublin |
| eu-west-2 | London |
| ap-south-1 | Mumbai |
| ap-east-1 | Hong Kong |
| ap-northeast-1 | Tokyo |
| ap-northeast-2 | Seoul |
| ap-southeast-1 | Singapore |
| ap-southeast-2 | Sydney |
| sa-east-1 | São Paulo |

## License

MIT
