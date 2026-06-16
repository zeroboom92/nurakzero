import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { Store, DbShape } from './store'

let mainWindow: BrowserWindow | null = null
let dashboardWindow: BrowserWindow | null = null
const store = new Store()

// 위젯 창 크기 / 대시보드 창 크기 / 온보딩 창 크기
const WIDGET_SIZE = { width: 380, height: 520 }
const ONBOARDING_SIZE = { width: 460, height: 640 }
const DASH_WIDTH = 720
const DASH_HEIGHT = 750 // 대시보드 높이는 위젯과 무관하게 고정

interface Bounds {
  x?: number
  y?: number
  width: number
  height: number
}

const PRELOAD = () => join(__dirname, '../preload/index.js')

function loadRenderer(win: BrowserWindow, hash?: string): void {
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    win.loadURL(hash ? `${devUrl}#${hash}` : devUrl)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), hash ? { hash } : undefined)
  }
}

// ---------------- 위젯 창 ----------------

function createWindow(): void {
  const saved = store.getSetting<Bounds>('windowBounds')
  const alwaysOnTop = store.getSetting<boolean>('alwaysOnTop') ?? false

  mainWindow = new BrowserWindow({
    width: saved?.width ?? WIDGET_SIZE.width,
    height: saved?.height ?? WIDGET_SIZE.height,
    x: saved?.x,
    y: saved?.y,
    minWidth: 320,
    minHeight: 360,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    alwaysOnTop,
    title: '누락제로',
    webPreferences: {
      preload: PRELOAD(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 저장된 투명도 적용 (위젯 창 전용)
  const savedOpacity = store.getSetting<number>('opacity') ?? 1
  mainWindow.setOpacity(savedOpacity)

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 위젯 위치/크기 저장 (디바운스). 대시보드가 열려 있으면 함께 따라 움직인다.
  let saveTimer: NodeJS.Timeout | null = null
  const onBoundsChange = (): void => {
    positionDashboardBesideWidget()
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (mainWindow) store.setSetting('windowBounds', mainWindow.getBounds())
    }, 400)
  }
  mainWindow.on('move', onBoundsChange)
  mainWindow.on('resize', onBoundsChange)
  mainWindow.on('close', () => {
    if (mainWindow) store.setSetting('windowBounds', mainWindow.getBounds())
    if (dashboardWindow && !dashboardWindow.isDestroyed()) dashboardWindow.close()
  })

  loadRenderer(mainWindow)
}

// ---------------- 대시보드 창 ----------------

/** 위젯이 화면 중앙 기준 왼쪽에 있는지(=대시보드를 오른쪽에 붙일지) 판정한다. */
function isWidgetOnLeft(): boolean {
  if (!mainWindow) return true
  const w = mainWindow.getBounds()
  const work = screen.getDisplayMatching(w).workArea
  return w.x + w.width / 2 < work.x + work.width / 2
}

/** 대시보드 창을 위젯 바로 옆(왼쪽이면 오른쪽, 오른쪽이면 왼쪽)에 배치한다. */
function positionDashboardBesideWidget(): void {
  if (!mainWindow || !dashboardWindow || dashboardWindow.isDestroyed()) return
  const w = mainWindow.getBounds()
  const work = screen.getDisplayMatching(w).workArea
  const onLeft = isWidgetOnLeft()
  const width = DASH_WIDTH
  const height = DASH_HEIGHT
  let x = onLeft ? w.x + w.width : w.x - width
  let y = w.y
  x = Math.max(work.x, Math.min(x, work.x + work.width - width))
  y = Math.max(work.y, Math.min(y, work.y + work.height - height))
  dashboardWindow.setBounds({ x, y, width, height })
}

function openDashboard(): void {
  if (!mainWindow) return

  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    positionDashboardBesideWidget()
    dashboardWindow.show()
    dashboardWindow.focus()
    mainWindow.webContents.send('dashboard:state', true)
    return
  }

  dashboardWindow = new BrowserWindow({
    width: DASH_WIDTH,
    height: DASH_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: mainWindow.isAlwaysOnTop(),
    webPreferences: {
      preload: PRELOAD(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  positionDashboardBesideWidget()

  dashboardWindow.once('ready-to-show', () => dashboardWindow?.show())
  dashboardWindow.on('closed', () => {
    dashboardWindow = null
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('dashboard:state', false)
    }
  })
  dashboardWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 슬라이드 방향을 해시로 함께 전달해, 대시보드 창이 첫 렌더부터 올바른 방향으로
  // 그려지도록 한다(렌더 후 방향이 바뀌어 애니메이션이 재시작되는 버벅임 방지).
  const dir = isWidgetOnLeft() ? 'right' : 'left'
  loadRenderer(dashboardWindow, `dashboard-${dir}`)
  mainWindow.webContents.send('dashboard:state', true)
}

function closeDashboard(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) dashboardWindow.close()
}

// ---------------- IPC ----------------

ipcMain.handle('db:load', () => store.load())

ipcMain.handle('db:save', (_e, partial: Partial<DbShape>) => {
  const result = store.save(partial)
  // 두 창의 상태를 동기화: 저장될 때마다 모든 창에 변경을 알린다.
  BrowserWindow.getAllWindows().forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send('db:changed')
  })
  return result
})

ipcMain.handle('window:setAlwaysOnTop', (_e, value: boolean) => {
  store.setSetting('alwaysOnTop', value)
  mainWindow?.setAlwaysOnTop(value)
  if (dashboardWindow && !dashboardWindow.isDestroyed()) dashboardWindow.setAlwaysOnTop(value)
  return value
})

ipcMain.handle('window:getAlwaysOnTop', () => store.getSetting<boolean>('alwaysOnTop') ?? false)

// 대시보드 열기/닫기 (별도 창). 반환값은 대시보드가 위젯의 어느 쪽에 붙는지.
ipcMain.handle('dashboard:open', (): 'left' | 'right' => {
  openDashboard()
  return isWidgetOnLeft() ? 'right' : 'left'
})
ipcMain.handle('dashboard:close', () => closeDashboard())

// 대시보드 창이 위젯 어느 쪽에 있는지 (슬라이드 방향 결정용)
ipcMain.handle('window:getExpandDirection', (): 'left' | 'right' =>
  isWidgetOnLeft() ? 'right' : 'left'
)

// 위젯 투명도 (0.3 ~ 1.0)
ipcMain.handle('window:setOpacity', (_e, value: number) => {
  const v = Math.min(1, Math.max(0.3, value))
  store.setSetting('opacity', v)
  mainWindow?.setOpacity(v)
  return v
})
ipcMain.handle('window:getOpacity', () => store.getSetting<number>('opacity') ?? 1)

// 위젯 크기 조절 (좌상단 위치는 유지, 우하단으로 확장/축소)
ipcMain.handle('window:setWidgetSize', (_e, width: number, height: number) => {
  if (!mainWindow) return
  const b = mainWindow.getBounds()
  const w = Math.max(320, Math.round(width))
  const h = Math.max(360, Math.round(height))
  mainWindow.setBounds({ x: b.x, y: b.y, width: w, height: h })
})

// 온보딩 동안 위젯 창을 키웠다가, 완료 시 위젯 크기로 복귀한다.
ipcMain.handle('window:setOnboarding', (_e, active: boolean) => {
  if (!mainWindow) return
  const target = active ? ONBOARDING_SIZE : WIDGET_SIZE
  const b = mainWindow.getBounds()
  const work = screen.getDisplayMatching(b).workArea
  let x = b.x
  let y = b.y
  x = Math.max(work.x, Math.min(x, work.x + work.width - target.width))
  y = Math.max(work.y, Math.min(y, work.y + work.height - target.height))
  mainWindow.setBounds({ x, y, width: target.width, height: target.height })
})

// 온보딩 화면 내용 높이에 맞춰 창 높이를 조절한다(좌상단 고정, 작업영역 안으로 보정).
ipcMain.handle('window:setOnboardingHeight', (_e, height: number) => {
  if (!mainWindow) return
  const b = mainWindow.getBounds()
  const work = screen.getDisplayMatching(b).workArea
  // 최대 800px로 제한하고, 더 긴 내용은 카드 안에서 스크롤되게 한다.
  const h = Math.max(300, Math.min(Math.round(height), 800, work.height - 48))
  const y = Math.max(work.y, Math.min(b.y, work.y + work.height - h))
  mainWindow.setBounds({ x: b.x, y, width: ONBOARDING_SIZE.width, height: h })
})

ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:close', () => mainWindow?.close())

ipcMain.handle('app:setStartOnBoot', (_e, value: boolean) => {
  store.setSetting('startOnBoot', value)
  app.setLoginItemSettings({ openAtLogin: value })
  return value
})

ipcMain.handle('app:getStartOnBoot', () => store.getSetting<boolean>('startOnBoot') ?? false)

// ---------------- lifecycle ----------------

app.whenReady().then(() => {
  const startOnBoot = store.getSetting<boolean>('startOnBoot') ?? false
  app.setLoginItemSettings({ openAtLogin: startOnBoot })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
