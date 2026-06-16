import { create } from 'zustand'

interface UiState {
  viewMonth: number
  settingsOpen: boolean
  alwaysOnTop: boolean
  startOnBoot: boolean
  /** 위젯 투명도 (0.3 ~ 1.0) */
  opacity: number
  /** 대시보드(별도 창)가 열려 있는지 */
  dashboardOpen: boolean

  initSettings: () => Promise<void>
  initDashboardSync: () => () => void
  setViewMonth: (month: number) => void
  toggleSettings: () => void
  setAlwaysOnTop: (value: boolean) => void
  setStartOnBoot: (value: boolean) => void
  setOpacity: (value: number) => void
  openDashboard: () => void
  closeDashboard: () => void
}

export const useUiStore = create<UiState>((set) => ({
  viewMonth: new Date().getMonth() + 1,
  settingsOpen: false,
  alwaysOnTop: false,
  startOnBoot: false,
  opacity: 1,
  dashboardOpen: false,

  initSettings: async () => {
    const [alwaysOnTop, startOnBoot, opacity] = await Promise.all([
      window.api.getAlwaysOnTop(),
      window.api.getStartOnBoot(),
      window.api.getOpacity()
    ])
    set({ alwaysOnTop, startOnBoot, opacity })
  },

  // 대시보드 창의 열림/닫힘을 위젯 창에 반영한다(🏠 버튼 상태).
  initDashboardSync: () => window.api.onDashboardState((open) => set({ dashboardOpen: open })),

  setViewMonth: (month) => set({ viewMonth: month }),

  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

  setAlwaysOnTop: (value) => {
    window.api.setAlwaysOnTop(value)
    set({ alwaysOnTop: value })
  },

  setStartOnBoot: (value) => {
    window.api.setStartOnBoot(value)
    set({ startOnBoot: value })
  },

  setOpacity: (value) => {
    const v = Math.min(1, Math.max(0.3, value))
    window.api.setOpacity(v)
    set({ opacity: v })
  },

  openDashboard: () => {
    window.api.openDashboard()
    set({ dashboardOpen: true })
  },

  closeDashboard: () => {
    window.api.closeDashboard()
    set({ dashboardOpen: false })
  }
}))
