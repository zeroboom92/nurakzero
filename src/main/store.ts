import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * 로컬 영속 저장소.
 *
 * 작업지시서의 SQLite 테이블(categories / user_tasks / settings)을
 * 동일한 논리 구조의 JSON 파일로 보관한다. 파일은 사용자 AppData(userData) 영역에
 * 저장되어 앱을 껐다 켜도 데이터가 유지된다.
 *
 * 파일 I/O는 메인 프로세스가 단독으로 소유하며, 렌더러는 IPC를 통해서만
 * 읽고 쓴다. 창 위치(windowBounds)는 메인이 직접 갱신한다.
 */

export interface DbShape {
  categories: unknown[]
  user_tasks: unknown[]
  settings: Record<string, unknown>
  schemaVersion: number
}

const EMPTY_DB: DbShape = {
  categories: [],
  user_tasks: [],
  settings: {},
  schemaVersion: 1
}

export class Store {
  private filePath: string
  private cache: DbShape

  constructor(fileName = 'nuranzero-data.json') {
    const dir = app.getPath('userData')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    this.filePath = join(dir, fileName)
    this.cache = this.read()
  }

  get path(): string {
    return this.filePath
  }

  private read(): DbShape {
    try {
      if (!existsSync(this.filePath)) return { ...EMPTY_DB }
      const raw = readFileSync(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<DbShape>
      return {
        categories: parsed.categories ?? [],
        user_tasks: parsed.user_tasks ?? [],
        settings: parsed.settings ?? {},
        schemaVersion: parsed.schemaVersion ?? 1
      }
    } catch (err) {
      console.error('[store] 읽기 실패, 빈 DB로 시작합니다:', err)
      return { ...EMPTY_DB }
    }
  }

  private write(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8')
    } catch (err) {
      console.error('[store] 쓰기 실패:', err)
    }
  }

  /** 전체 DB 반환 (렌더러 초기 로드용). */
  load(): DbShape {
    return this.cache
  }

  /**
   * 렌더러가 보낸 데이터를 병합 저장한다.
   * settings는 얕은 병합으로 갱신하되, 메인이 관리하는 windowBounds는 보존한다.
   */
  save(partial: Partial<DbShape>): DbShape {
    const preservedBounds = this.cache.settings?.windowBounds
    this.cache = {
      ...this.cache,
      categories: partial.categories ?? this.cache.categories,
      user_tasks: partial.user_tasks ?? this.cache.user_tasks,
      settings: { ...this.cache.settings, ...(partial.settings ?? {}) },
      schemaVersion: partial.schemaVersion ?? this.cache.schemaVersion
    }
    // 렌더러 저장 시 windowBounds를 덮어쓰지 않도록 메인이 가진 값을 유지
    if (preservedBounds !== undefined && partial.settings?.windowBounds === undefined) {
      this.cache.settings.windowBounds = preservedBounds
    }
    this.write()
    return this.cache
  }

  /** 메인이 창 위치/크기를 직접 갱신할 때 사용. */
  setSetting(key: string, value: unknown): void {
    this.cache.settings[key] = value
    this.write()
  }

  getSetting<T = unknown>(key: string): T | undefined {
    return this.cache.settings[key] as T | undefined
  }
}
