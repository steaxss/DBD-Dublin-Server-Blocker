# DBD Server Blocker — CLAUDE.md

## Project Overview
Electron + React + TypeScript app that blocks Dead by Daylight from connecting to specific AWS regions via Windows Firewall rules. Targets the DBD exe specifically (not global blocks).

## Architecture

```
├── src/
│   ├── main/               # Main process (Node/Electron)
│   │   ├── index.ts        # App lifecycle, tray, window
│   │   ├── ipc.ts          # All IPC handlers (block, unblock, settings, etc.)
│   │   ├── firewall.ts     # PowerShell firewall operations
│   │   ├── ips.ts          # AWS IP range fetching + caching
│   │   └── settings.ts     # User settings persistence (exe path, permanent regions)
│   ├── preload/
│   │   └── index.ts        # contextBridge — exposes window.api
│   └── renderer/
│       └── src/
│           ├── App.tsx     # Root component (header, toolbar, exclusive mode, settings modal)
│           ├── types.ts    # TypeScript interfaces (RegionState, ElectronAPI, etc.)
│           ├── regions.ts  # Region definitions (id, name, country, flag, continent)
│           ├── hooks/
│           │   └── useAppState.ts  # All app state + actions
│           ├── components/
│           │   ├── Header.tsx      # Titlebar (Windows-style controls)
│           │   ├── RegionCard.tsx  # Individual region card with toggle + permanent/exclusive states
│           │   ├── RegionGrid.tsx  # Grid grouped by continent
│           │   └── ConsolePanel.tsx# Log console at bottom
│           └── styles/
│               └── globals.css    # Tailwind + CSS utilities + design tokens
├── resources/
│   └── icon.png
└── package.json
```

## Key Technical Details

### Firewall Rules
- Rule naming: `Block_DBD_{regionId}_{city}` (e.g. `Block_DBD_eu-west-1_Dublin`)
- Targets outbound traffic from the DBD exe specifically (program filter applied in step 3)
- 4-step creation: cleanup → create base rule → apply program filter → verify
- Permanent rules: survive app quit (not removed on `before-quit`)

### IPC Channels
| Channel | Direction | Description |
|---|---|---|
| `block-region` | invoke | Block one region |
| `unblock-region` | invoke | Unblock one region |
| `block-all` | invoke | Block all regions |
| `unblock-all` | invoke | Unblock all non-permanent regions |
| `block-except` | invoke | Exclusive mode: block all except one |
| `get-status` | invoke | Get current firewall state |
| `get-cidr-counts` | invoke | Get cached CIDR counts |
| `refresh-ips` | invoke | Fetch/refresh AWS IP ranges |
| `is-admin` | invoke | Check admin privileges |
| `get-exe-path` | invoke | Get configured DBD exe path |
| `set-exe-path` | invoke | Save DBD exe path + validate |
| `browse-exe` | invoke | Open file picker dialog |
| `get-permanent-regions` | invoke | Get permanently blocked region IDs |
| `mark-permanent` | invoke | Mark region as permanently blocked |
| `unmark-permanent` | invoke | Remove permanent flag (keeps block active) |
| `blocked-count-update` | send | Renderer → main: sync tray count |
| `log` | on | Main → renderer: log entry |
| `status-change` | on | Main → renderer: region status update |
| `cidr-count` | on | Main → renderer: CIDR count update |
| `unblock-all-done` | on | Main → renderer: tray unblock all completed |

### Settings (userData/settings.json)
```json
{
  "exePath": "C:\\...\\DeadByDaylight-Win64-Shipping.exe",
  "permanentRegions": ["eu-west-1", "us-east-1"]
}
```

### AWS Regions Tracked
15 regions: us-east-1/2, us-west-1/2, ca-central-1, eu-central-1, eu-west-1/2, ap-south-1, ap-east-1, ap-northeast-1/2, ap-southeast-1/2, sa-east-1

## Design System
- **Font**: Poppins (500/600/700/900)
- **Background**: `#0a0a0a` + animated radial glows (purple/green/blue)
- **Primary**: `#B579FF` purple, gradient `linear-gradient(135deg, #7046DA 0%, #2A175E 100%)`
- **Title gradient**: `linear-gradient(94deg, #FF6BCB 0%, #FFE96D 50%, #B579FF 100%)`
- **Header gradient**: `linear-gradient(135deg, #B579FF 0%, #44FF41 50%, #5AC8FF 100%)`
- **Danger/Block**: `#F44336`, gradient `linear-gradient(135deg, #F44336 0%, #C62828 100%)`
- **Success/Open**: `#44FF41`
- **Warning/Permanent**: `#FF9800`
- **Exclusive**: `#B579FF` purple
- **Cards**: `rgba(255,255,255,0.03)` + `backdrop-blur` + `outline 1px rgba(255,255,255,0.10)`
- **Titlebar**: Windows-style (32px, transparent buttons, red close on hover)
- Reference project: `C:\Users\steaxs\Desktop\M\dev\dbdoverlaytools\dbd-overlaytools`

## Build & Dev
```bash
npm run dev      # development
npm run build    # production build
```
Requires Windows + PowerShell + admin privileges to operate firewall rules.
