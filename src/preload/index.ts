import { contextBridge, ipcRenderer } from 'electron'

const api = {
  loadDb: () => ipcRenderer.invoke('db:load'),
  saveDb: (partial: unknown) => ipcRenderer.invoke('db:save', partial),
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', value),
  getAlwaysOnTop: () => ipcRenderer.invoke('window:getAlwaysOnTop'),
  setOpacity: (value: number) => ipcRenderer.invoke('window:setOpacity', value),
  getOpacity: () => ipcRenderer.invoke('window:getOpacity'),
  setWidgetSize: (width: number, height: number) =>
    ipcRenderer.invoke('window:setWidgetSize', width, height),
  setOnboarding: (active: boolean) => ipcRenderer.invoke('window:setOnboarding', active),
  setOnboardingHeight: (height: number) =>
    ipcRenderer.invoke('window:setOnboardingHeight', height),
  openDashboard: () => ipcRenderer.invoke('dashboard:open'),
  closeDashboard: () => ipcRenderer.invoke('dashboard:close'),
  getExpandDirection: () => ipcRenderer.invoke('window:getExpandDirection'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  setStartOnBoot: (value: boolean) => ipcRenderer.invoke('app:setStartOnBoot', value),
  resetApp: () => ipcRenderer.invoke('db:reset'),
  hardResetApp: () => ipcRenderer.invoke('app:hardReset'),
  getStartOnBoot: () => ipcRenderer.invoke('app:getStartOnBoot'),
  /** 다른 창에서 데이터가 바뀌면 호출된다. 해제 함수를 반환. */
  onDbChanged: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('db:changed', handler)
    return () => ipcRenderer.removeListener('db:changed', handler)
  },
  /** 대시보드 창 열림/닫힘 상태 변화. 해제 함수를 반환. */
  onDashboardState: (cb: (open: boolean) => void): (() => void) => {
    const handler = (_e: unknown, open: boolean): void => cb(open)
    ipcRenderer.on('dashboard:state', handler)
    return () => ipcRenderer.removeListener('dashboard:state', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
