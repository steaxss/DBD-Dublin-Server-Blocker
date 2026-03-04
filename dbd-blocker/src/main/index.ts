import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } from 'electron'
import { join } from 'path'
import { unblockAll, getBlockedRegions } from './firewall'
import { registerIpcHandlers } from './ipc'

// Shared region IDs — imported by ipc.ts
export const REGION_IDS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'ca-central-1',
  'eu-central-1', 'eu-west-1', 'eu-west-2',
  'ap-south-1', 'ap-east-1', 'ap-northeast-1', 'ap-northeast-2',
  'ap-southeast-1', 'ap-southeast-2',
  'sa-east-1'
]

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let blockedCount = 0

// ---------------------------------------------------------------------------
// Log emitter (before window exists)
// ---------------------------------------------------------------------------

function silentLog(_level: string, _message: string): void {
  // Used before window is ready
}

// ---------------------------------------------------------------------------
// Tray
// ---------------------------------------------------------------------------

function updateTrayTooltip(): void {
  if (!tray) return
  tray.setToolTip(
    blockedCount > 0
      ? `DBD Blocker — ${blockedCount} région${blockedCount > 1 ? 's' : ''} bloquée${blockedCount > 1 ? 's' : ''}`
      : 'DBD Blocker — Aucun blocage actif'
  )
}

function buildTrayMenu(): void {
  if (!tray) return
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Afficher',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    {
      label: blockedCount > 0
        ? `${blockedCount} région${blockedCount > 1 ? 's' : ''} bloquée${blockedCount > 1 ? 's' : ''}`
        : 'Aucun blocage actif',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Tout débloquer',
      enabled: blockedCount > 0,
      click: async () => {
        await unblockAll(REGION_IDS, silentLog)
        blockedCount = 0
        buildTrayMenu()
        updateTrayTooltip()
        mainWindow?.webContents.send('unblock-all-done')
      }
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: async () => {
        isQuitting = true
        await unblockAll(REGION_IDS, silentLog)
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
}

function createTray(): void {
  // Minimal 16x16 transparent PNG as placeholder icon
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('DBD Blocker')
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
  buildTrayMenu()
}

// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#09090b',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#09090b',
      symbolColor: '#a1a1aa',
      height: 32
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Hide to tray on close (not quit)
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ---------------------------------------------------------------------------
// IPC for tray sync
// ---------------------------------------------------------------------------

ipcMain.on('blocked-count-update', (_, count: number) => {
  blockedCount = count
  buildTrayMenu()
  updateTrayTooltip()
})

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  createWindow()
  createTray()

  if (mainWindow) {
    registerIpcHandlers(mainWindow)
  }

  // Restore state from firewall on startup
  const status = await getBlockedRegions(REGION_IDS)
  blockedCount = Object.values(status).filter(Boolean).length
  buildTrayMenu()
  updateTrayTooltip()
})

app.on('before-quit', async () => {
  isQuitting = true
  await unblockAll(REGION_IDS, silentLog)
})

app.on('window-all-closed', () => {
  // On Windows, keep app alive in tray — don't quit
})

app.on('activate', () => {
  mainWindow?.show()
})
