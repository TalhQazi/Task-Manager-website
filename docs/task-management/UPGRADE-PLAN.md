# Task Management — Multi-View Upgrade Plan

> **Type:** Enterprise upgrade (not greenfield). Backward-compatible, additive.
> **Rule of this project:** one shared task dataset; views change **presentation only**;
> never duplicate task records; reuse before building.
> Nothing here rewrites existing CRUD, comments, attachments, activity, notifications,
> permissions, APIs, or reports.

---

## 0. Analysis of the existing module (what we reuse)

I surveyed the live code first. A lot of the spec is **already built** — the upgrade is
mostly a **presentation layer** over existing data plus a few small additive tables.

### Backend (reuse)
| Concern | Exists as | Reuse for |
|---|---|---|
| Task entity | `models/Task.js` — `assignees[]`, `teamLead`, `priority`, `status` (pending/in-progress/completed/overdue), `dueDate`, `executionPriority`, `startedAt`, `firstStartedAt`, `completedAt`, `totalTimeSpent`, `contributors`, `taskNumber` | **All 9 views** read this one collection |
| Task list API | `routes/tasks.js` `GET /` — pagination, `search`, `status`, `priority`, `sort=priority`, `projectId`, `assignment`, `assignee` | Base feed for every view (extend, don't replace) |
| Status/order mutations | `PATCH /tasks/:id/status`, `POST /tasks/:id/priority`, `POST /tasks/resequence` | **Kanban** drag-drop, **Timeline** reorder |
| Workload aggregation | `GET /tasks/assignee-stats` | **Employee Workload** view |
| WIP subsystem | `models/WorkSession.js`, `WorkSessionEvent.js`, `TaskStatusSnapshot.js`, `routes/wip.js`, `repositories/wipRepository.js`, `constants/wip.js`, `lib/wipElapsed.js` | **WIP view** (already exists — integrate, don't rebuild) |
| Preferences | `models/UserPreference.js` (`userId` unique, `uiPreferences.layoutConfig: Map`), `routes/uiPreferences.js` | **User Task Preferences / Saved Views** (extend) |
| Comments / attachments / activity / notifications | `TaskComment`, `Attachment`, `ActivityLog`, `utils/notifications`, `contributionTracker` | Unchanged — reused by the task detail drawer in every view |
| Dashboard | `routes/dashboard.js` | **Executive Dashboard** (extend with aggregates) |

### Frontend (reuse)
| Concern | Exists as | Reuse for |
|---|---|---|
| Admin task page | `pages/admin/Tasks.tsx` — tabs (all/projects/tasks), `viewByPriority`, card/list hybrid, task detail drawer, create/edit/reassign dialogs | Host page for the view switcher; detail drawer shared by all views |
| Manager / Employee task pages | `pages/manger/Tasks.tsx`, `Employee/screens/Tasks.tsx` | Same view switcher, role-scoped |
| Timeline component | `components/shared/TaskTimeline.tsx` (per-task, live timer) | **Timeline/Gantt** building block |
| WIP dashboard UI | `pages/admin/WipDashboard.tsx`, `components/wip/*` | **WIP view** |
| Live timer | `hooks/useGlobalTimer.ts` | WIP + Timeline |
| Data layer | `@tanstack/react-query`, `apiFetch` (`@/lib/manger/api`) | Shared dataset cache |

### Net conclusion
- **Already satisfied:** WIP view, Work Sessions table, User Preferences store, workload data source, status/reorder mutations, task detail (comments/attachments/activity).
- **Genuinely new tables (only 3):** `TaskDependency`, `EmployeeCapacity`, `TaskSavedView`.
- **Everything else = new frontend view components** fed by the **same** `/api/tasks` data.

---

## 1. Architecture strategy — one dataset, many presentations

The single rule that guarantees "no duplicate task records":

```
                       ┌──────────────────────────────┐
                       │  useTaskDataset()  (shared)   │  ← ONE react-query cache key
                       │  GET /api/tasks (+filters)    │     per (filters, sort)
                       └──────────────┬───────────────┘
                                      │ same array of tasks
   ┌──────────┬──────────┬───────────┼───────────┬───────────┬──────────┐
   ▼          ▼          ▼           ▼           ▼           ▼          ▼
 Card       List      Compact     Kanban      Calendar    Timeline    WIP / Exec
 View       View       View        View         View       (Gantt)    (reuse)
```

- **`useTaskDataset`** is the *only* thing that fetches tasks. Every view is a **pure
  presentation** of the same in-memory array → switching views never re-creates or
  duplicates records; at most it re-queries the same cache key.
- **`<TaskViewSwitcher>`** renders the active view; the active view id is a URL param
  (`?view=kanban`) and persisted per-user in `UserPreference` (see §4).
- Views share one **filter/search/sort state** (already partly in `Tasks.tsx`) lifted
  into a `TaskViewContext`.
- The existing **task detail drawer** (comments/attachments/activity/status) is opened
  by every view via the shared `selectedTask` state — unchanged behavior.

This is added **inside** the current `Tasks.tsx` page — same layout, same navigation,
same design language. The tabs/toolbar gain a view selector; nothing is redesigned.

---

## 2. Shared foundation (build once, before any view)

**New frontend files**
- `src/components/tasks/useTaskDataset.ts` — the single shared react-query hook (wraps
  the existing `/api/tasks` call already in `Tasks.tsx`, unchanged params).
- `src/components/tasks/TaskViewContext.tsx` — filters/sort/search/selection + active view.
- `src/components/tasks/TaskViewSwitcher.tsx` — the view registry + selector chip row.
- `src/components/tasks/views/` — one file per view (see §3).
- `src/components/tasks/VirtualList.tsx` — thin wrapper over a virtualization lib
  (`@tanstack/react-virtual`, already React-Query-adjacent and dependency-light).

**Modified frontend files**
- `src/pages/admin/Tasks.tsx` — extract the current card/list rendering into
  `views/CardView.tsx`; mount `<TaskViewSwitcher>`; keep all existing dialogs/drawer.
- `src/pages/manger/Tasks.tsx`, `src/Employee/screens/Tasks.tsx` — mount the same
  switcher (role scoping already handled server-side).

**Backend (additive, backward-compatible)**
- `routes/tasks.js` `GET /` gains **optional** params — all default to current behavior:
  - `fields=card|list|min` → projection to cut payload for large lists (perf).
  - `cursor=<id>&limit=` → optional **cursor pagination** alongside existing `page`
    (for 100k virtual scroll); when absent, current `page` behavior is unchanged.
  - `dueFrom`, `dueTo` → date-range filter for Calendar/Timeline.
  - `groupBy=status|assignee|project` → returns `{ groups: [{key,count}], items }` for
    Kanban columns / dashboard without shipping all rows.
- **No field renames, no removed params.** Existing callers keep working byte-for-byte.

---

## 3. The nine views

Each view: **integration · files · DB · API · frontend · backward-compat.**

### 3.1 Card View (improve existing)
- **Integration:** the current card grid in `Tasks.tsx` becomes `views/CardView.tsx`,
  fed by `useTaskDataset`. Adds density from prefs, lazy image loading, virtualized grid.
- **Files:** *modify* `Tasks.tsx` (extract), *new* `views/CardView.tsx`.
- **DB:** none. **API:** none (optional `fields=card`). 
- **Frontend:** reuse existing card markup + `TaskTimeline`, add `@tanstack/react-virtual`.
- **Compat:** default view = Card → page looks identical on first load.

### 3.2 List View
- **Integration:** virtualized table (title, assignees, status, priority, due, project).
- **Files:** *new* `views/ListView.tsx`, reuse `VirtualList.tsx`.
- **DB:** none. **API:** optional `fields=list` projection. 
- **Frontend:** column config from `UserPreference.taskViews.list.columns`; row click → shared drawer.
- **Compat:** additive.

### 3.3 Compact View
- **Integration:** dense single-line rows (2–3× more per screen) — same data, tighter marks.
- **Files:** *new* `views/CompactView.tsx` (variant of ListView with density preset).
- **DB/API:** none. **Compat:** additive.

### 3.4 Kanban View
- **Integration:** columns = existing `status` enum (pending / in-progress / completed /
  overdue). Card order within a column uses existing **`executionPriority`**. Drag between
  columns → existing `PATCH /tasks/:id/status`; reorder → existing
  `POST /tasks/:id/priority` / `POST /tasks/resequence`. **No new mutation APIs.**
- **Files:** *new* `views/KanbanView.tsx` (dnd via `@dnd-kit/core`).
- **DB:** none. **API:** optional `groupBy=status` for column counts at scale.
- **Frontend:** optimistic move → reuse existing status mutation (which already writes
  activity + notifications + firstStartedAt/startedAt). Nothing about the record duplicates.
- **Compat:** additive; the same status change is identical to using the detail drawer.

### 3.5 Employee Workload View
- **Integration:** per-assignee load = open tasks + hours vs. **capacity**. Reuses the
  existing **`GET /tasks/assignee-stats`** aggregation; adds capacity from a new small table.
- **Files:** *new* `views/WorkloadView.tsx`; *new* backend `models/EmployeeCapacity.js`
  + endpoints `GET/PUT /api/employee-capacity`.
- **DB:** **new** `EmployeeCapacity { employeeId, weeklyHours, dailyHours, effectiveFrom }`.
- **API:** extend `assignee-stats` response (additive fields: `estimatedHours`,
  `utilizationPct` when capacity exists) + new capacity CRUD.
- **Frontend:** heat bars (green→amber→red) using existing design tokens.
- **Compat:** capacity optional → without it, view falls back to task counts only.

### 3.6 Calendar View
- **Integration:** tasks placed by `dueDate` (and optionally `firstStartedAt`). Month/week/day.
- **Files:** *new* `views/CalendarView.tsx`.
- **DB:** none. **API:** optional `dueFrom`/`dueTo` range param on `GET /tasks` (added in §2).
- **Frontend:** lightweight month grid (no heavy calendar lib needed); click day → filtered
  list; drag task to a new day → existing `PUT /tasks/:id` (dueDate) — reuses current update.
- **Compat:** additive; reuses the existing update endpoint for reschedule.

### 3.7 Timeline (Gantt)
- **Integration:** bars from `firstStartedAt`/`startedAt` → `dueDate`/`completedAt` (all
  already on Task). Dependencies drawn from a new light table; critical path optional.
- **Files:** *new* `views/TimelineView.tsx`; *new* backend `models/TaskDependency.js` +
  `GET/POST/DELETE /api/task-dependencies`.
- **DB:** **new** `TaskDependency { predecessorId, successorId, type: FS|SS|FF|SF, lagDays }`
  (a separate edge table — **existing Task rows are never modified**).
- **API:** new dependency CRUD (read-mostly); timeline bar data comes from existing task fields.
- **Frontend:** reuse `TaskTimeline` styling language; virtualize rows for 100k.
- **Compat:** dependencies are additive metadata; a task with no dependencies renders a plain bar.

### 3.8 Work In Progress (WIP) — reuse existing
- **Integration:** the WIP subsystem already exists (`routes/wip.js`, `WorkSession`,
  `WipDashboard.tsx`, `components/wip/*`). We **embed the existing WIP dashboard as a view
  tab** — no new WIP logic, no new tables.
- **Files:** *new* thin `views/WipView.tsx` that renders the existing WIP components inside
  the switcher (or links to `/admin/wip`).
- **DB/API:** none (reuse `WorkSession`, `TaskStatusSnapshot`, `/api/wip/*`).
- **Compat:** zero change to the WIP system.

### 3.9 Executive Dashboard
- **Integration:** read-only KPIs — throughput, on-time %, status mix, workload heat,
  overdue trend, WIP utilization. Server-side **aggregation** (never ship 100k rows).
- **Files:** *new* `views/ExecutiveDashboard.tsx`; *new/extended* backend
  `routes/dashboard.js` aggregate endpoints (`GET /api/dashboard/tasks/summary`,
  `/throughput`, `/workload`).
- **DB:** none (aggregation pipelines over existing `tasks` + `workSessions`).
- **API:** new **read-only** aggregate endpoints (additive).
- **Frontend:** stat tiles + charts using the app's existing chart/design system.
- **Compat:** additive, read-only.

---

## 4. Database changes (minimal, additive only)

**Extend (no new table):**
- `UserPreference` → add `taskViews` sub-doc:
  `{ defaultView, density, list:{columns[]}, kanban:{collapsedColumns[]}, calendar:{mode} }`.
  Stored per existing `userId`; served by existing `routes/uiPreferences.js` (add fields).

**New tables (3):**
- `TaskSavedView { userId, name, isShared, viewType, filters, sort, columns }` — named
  filter presets ("My overdue", "Team Kanban"). Per-user; optional org share.
- `EmployeeCapacity { employeeId, weeklyHours, dailyHours, effectiveFrom }` — Workload view.
- `TaskDependency { predecessorId, successorId, type, lagDays, createdBy }` — Gantt edges.

**Reuse (no change):** `WorkSession`, `WorkSessionEvent`, `TaskStatusSnapshot`, `Task`,
`TaskComment`, `Attachment`, `ActivityLog`. **No existing table is modified.**

---

## 5. API changes (extend, never replace)

| Endpoint | Change | Backward compatible? |
|---|---|---|
| `GET /api/tasks` | + optional `fields`, `cursor`, `dueFrom/dueTo`, `groupBy` | Yes — omitting them = today's behavior |
| `PATCH /tasks/:id/status`, `/priority`, `/resequence` | reused as-is by Kanban/Timeline | Yes — unchanged |
| `GET /tasks/assignee-stats` | + optional capacity-derived fields | Yes — additive fields |
| `GET /api/wip/*` | reused as-is by WIP view | Yes — unchanged |
| **New** `GET/PUT /api/employee-capacity` | Workload | New route |
| **New** `GET/POST/DELETE /api/task-dependencies` | Gantt | New route |
| **New** `GET /api/task-saved-views` (CRUD) | Saved views | New route |
| **New** `GET /api/dashboard/tasks/*` (summary/throughput/workload) | Executive | New read-only route |
| `GET/PUT /api/ui-preferences` | + `taskViews` fields | Yes — additive |

All new routes mount with the **existing `requireAuth` + `requireClearHire`** and respect
current role scoping (the same middleware chain as `/api/tasks`).

---

## 6. Performance (100k+ tasks)

- **Virtual scrolling** in List/Compact/Kanban/Timeline via `@tanstack/react-virtual` —
  only visible rows mount.
- **Cursor pagination** (`cursor`+`limit`) for infinite scroll; keyset on
  `{updatedAt,_id}` (indexed) — no deep `skip`.
- **Projections** (`fields=card|list|min`) shrink payloads; detail drawer fetches the full
  doc on open (existing `GET /tasks/:id`).
- **Server-side aggregation** for Kanban counts, Workload, and Executive Dashboard
  (`groupBy`, `$group`) — never transfer 100k rows to the client.
- **Shared cache**: one react-query key per (filters,sort) feeds all views → switching
  view is instant, no refetch, no duplication. Backend `lib/cache.js` (Redis) already
  wraps `/api/tasks`; extend the same cache to aggregates with short TTLs.
- **Debounced** search/filter; **lazy-load** heavy views (`React.lazy` per view file).
- **Indexes** to add (additive): `tasks {status,executionPriority}`,
  `tasks {dueDate}`, `tasks {updatedAt,_id}` (cursor), plus `TaskDependency {predecessorId}`,
  `{successorId}`, `EmployeeCapacity {employeeId}` — built in the background.

---

## 7. Security

- No change to authentication/authorization. Every new route uses the **same middleware
  chain** as `/api/tasks` (`requireAuth`, `requireClearHire`) and the same role rules.
- Views are presentation only — they can only show tasks the existing list API already
  returns for that user, so **no view can widen visibility**.
- Saved-view sharing and capacity edits are gated to manager/admin via the existing
  `requireRole` helper.

---

## 8. Backward-compatibility guarantees

1. **Default view = Card**, rendering the current grid → the page looks unchanged on load.
2. `/api/tasks` and every existing task endpoint keep their exact contract; new params are
   optional and default to today's behavior.
3. **No existing table is modified**; only 3 additive tables + additive `UserPreference` fields.
4. The task detail drawer, comments, attachments, activity, notifications, permissions,
   and reports are **reused unchanged** by all views.
5. Manager/Employee task pages get the same switcher; server-side role scoping is untouched.
6. One dataset, presentation-only views → **task records are never duplicated**.

---

## 9. Implementation roadmap

| Phase | Deliverable | New tables | Risk |
|---|---|---|---|
| 0 | Shared foundation: `useTaskDataset`, `TaskViewContext`, `TaskViewSwitcher`, virtualization; extract current grid → `CardView` | none | low (behavior identical) |
| 1 | List + Compact views + `fields` projection + cursor pagination | none | low |
| 2 | Kanban (reuse status/priority mutations) + `groupBy` | none | med (dnd) |
| 3 | Calendar (dueDate range) | none | low |
| 4 | Workload view + `EmployeeCapacity` + capacity CRUD | 1 | low |
| 5 | Timeline/Gantt + `TaskDependency` | 1 | med |
| 6 | WIP view (embed existing) | none | low |
| 7 | Executive Dashboard + aggregate endpoints | none | low |
| 8 | Saved views + `TaskSavedView` + `UserPreference.taskViews` | 1 | low |

**First PR (safe, invisible):** Phase 0 — extract the current card grid into a view behind
the switcher with Card as default. Zero visual/behavioral change; everything else builds on it.
