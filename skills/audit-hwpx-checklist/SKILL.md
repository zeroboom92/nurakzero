---
name: audit-hwpx-checklist
description: Extract, verify, and convert Korean HWPX school audit manuals into source-traceable audit checklist data and widget-ready tasks for any audit area, including required documents and original-manual validation.
---

# Audit HWPX Checklist

Use this skill when a user provides a Korean school audit manual in `.hwpx` format and asks to extract audit-check data, verify it against the original manual, or convert it into program/widget tasks. This skill is for every audit area, not only 개인정보보호.

## Core Rule

The HWPX file supplied by the user is the `original_data`. Do not treat generated summaries, prior JSON, or app templates as the source of truth. Existing app data may be used only for comparison or migration.

## Workflow

1. Record the original HWPX path, document title, target audit area/item, and relevant item code if known.
2. Inspect the HWPX archive. Main text is usually in `Contents/section*.xml`; sometimes headers or preview text help locate sections.
3. Extract compact source evidence only:
   - target keywords, such as 업무명 or 점검항목명
   - item codes, such as `6-3`
   - audit-table patterns, such as `업무 구분`, `감사 점검내용`, `점검 서류(대상)`, `감사 점검 사항`, `증빙자료`
4. Identify source tables:
   - index/table-of-contents table
   - legal/reference or 근거 table
   - main audit table
   - self-check or 증빙자료 table
5. Create source-faithful audit data first. Do not collapse a manual row into one item when the `감사 점검내용` cell contains multiple paragraphs, bullets, numbered items, or self-check emphasis. Each meaningful paragraph or bullet that can cause audit omission should become its own source item. Each source item should include:
   - `id`
   - `title`
   - `sourceType`
   - `sourceTables`
   - `sourceBasis`
   - `whatToCheck`
   - `requiredDocuments`
   - `requiredNoticeItems`, only if the source lists mandatory notice items
   - `importance`
6. Convert source items into widget-ready tasks. The widget exists to prevent omissions, so tasks must be specific enough that a user can act without reopening the manual. Each task should include:
   - `templateTaskId`
   - `sourceAuditItemId`
   - `title`
   - `shortTitle`
   - `description`
   - `taskType`
   - `cycle`
   - `recommendedMonth`
   - `recommendedDay`
   - `priority`
   - `riskLevel`
   - `isCore`
   - `isAuditFocus`
   - `checkQuestions`
   - `evidence`
   - `completionCriteria`
   - `sourceBasis`
   - `monthReason`
7. Validate every source item and widget task back to original table text. Mark each task as one of:
   - direct source item
   - split from source item
   - source-supported but not explicit
   - operational derivative

## Widget Task Guidance

- The program exists to prevent missed audit work. Do not stop at source-summary data.
- Split broad manual rows into practical tasks whenever the row contains sub-checks. Do not use only `업무 구분` as the task title.
- Preserve the hierarchy in the task text: if a bullet belongs under a parent line, include the parent context in the title or `sourceBasis`.
- Use self-check tables (`감사 점검 사항`, `증빙자료`, `점검 결과`) to confirm that emphasized items are represented as tasks.
- Keep required documents in `evidence`; this is critical for audit readiness.
- Add recommended months only as operational guidance. Say clearly that dates are not original-manual dates unless the source explicitly provides them.
- Prefer omission-proof tasks over short lists. If a broad row has 8 sub-checks, create the 8 actionable tasks.
- Remove exact duplicate tasks caused by repeated manual text, but do not remove a task merely because it sounds similar.

## Output Rules

- Produce both:
  - source-faithful audit JSON
  - widget-ready template JSON or a patch to the app template
- Produce a short verification memo with source table indexes and mismatch notes.
- Keep user-facing reports concise: source file, extracted item count, widget task count, verification result, and changed paths.
- Do not paste large raw XML or full manual text into chat.

## Helper Script

Use `scripts/extract-hwpx-audit-tables.ps1` to extract compact table text from an HWPX file without loading the full XML into the conversation.

For high-accuracy conversion, first preserve cell paragraph boundaries from HWPX. A flattened cell often loses the hierarchy needed to split `감사 점검내용` correctly.
