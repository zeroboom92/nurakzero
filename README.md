# 누락제로 — 학교 감사 점검 위젯

학교 자율형감사·종합감사 준비를 위한 설치형 개인 업무 체크 위젯입니다.
이번 달에 해야 할 점검사항을 바탕화면 위젯으로 띄워 두고, 완료한 항목은
위젯에서 사라지게 하여 업무 누락을 방지합니다. (1차 버전: 개인정보보호 업무)

## 기술 스택

- Electron + electron-vite
- React + TypeScript
- Zustand (상태 관리)
- date-fns
- 로컬 저장: 사용자 AppData 영역의 JSON 파일
  (작업지시서의 SQLite 테이블 구조를 동일하게 유지. 네이티브 빌드 없이 동작하며
  추후 SQLite로 교체 가능)

## 개발 실행

```bash
npm install
npm run dev
```

`npm run dev` 한 번으로 Electron 위젯이 실행됩니다. (설치 파일/자동 업데이트/
릴리즈 배포는 추후 단계로 남겨 두었습니다.)

## 주요 기능

- 메인 위젯: 이번 달 미완료 점검 항목만 표시, 지연 항목 상단 우선 표시
- 완료 체크 시 위젯에서 부드럽게 사라짐 / 완료 상태 영구 저장
- ◀ ▶ 로 저번달·다음달 항목 확인
- 🏠 버튼으로 전체 대시보드 열기 (창이 확장됨)
- 대시보드: 전체/완료/미완료/지연 요약, 월별·수시·완료 목록
- 항목 추가 / 수정 / 삭제(확인창) / 월 변경(드롭다운)
- 수시 항목을 이번 달 위젯에 노출 토글
- ⚙️ 설정: 항상 위에 표시 / 시작 시 자동 실행 / 최소화 / 종료
- 창 위치·크기 저장, 재실행 후 데이터 유지

## 폴더 구조

```
src/
  main/        Electron 메인 프로세스 (창 관리, 로컬 저장, 시작프로그램)
  preload/     contextBridge로 안전하게 노출하는 API
  renderer/    React UI
    src/
      components/  widget · dashboard · common
      stores/      taskStore · uiStore (Zustand)
      data/        업무별 점검 템플릿 (개인정보보호)
      types/       데이터 타입
      utils/       날짜 · 점검상태 유틸
      styles/      theme · global · components
```

## 데이터 위치

- Windows: `%APPDATA%/nuranzero/nuranzero-data.json`
