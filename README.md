# Bug Tracker

A modern, full-featured bug tracking application built with React and TypeScript. Track bugs through a complete 7-stage lifecycle, collaborate with your team, and visualise project health — all in a clean, responsive interface with dark mode support.

![Bug Tracker Screenshot](https://i.postimg.cc/d1WtCPmX/ksjd.png)

## Live Demo

[Bug Tracking System — Live](https://bugdesk.netlify.app/)

---

## Features

### 7-Stage Bug Lifecycle

Bugs move through a structured pipeline from first report to closure:

| Stage | Color | Meaning |
| --- | --- | --- |
| **New** | Grey `#6B7280` | Just reported, awaiting triage |
| **Open** | Blue `#3B82F6` | Confirmed and queued for work |
| **In Progress** | Yellow `#EAB308` | Actively being worked on |
| **In Review** | Purple `#8B5CF6` | Code review in progress |
| **Testing** | Orange `#F97316` | QA verification in progress |
| **Closed** | Green `#22C55E` | Resolved and verified |
| **Rejected** | Red `#EF4444` | Not a valid bug / won't fix |

New bugs are always created with status **New** — no manual status selection needed at creation time.

---

### Dashboard

- **Stat cards** — live counts for Total, Open, In Progress, and Closed bugs with count-up animation
- **Status Distribution** — donut chart with 7 colour-coded slices, percentage labels, and a full legend showing counts
- **Status Breakdown** — 7 horizontal progress bars; shows a grey dashed empty bar for any status with 0 bugs (never a filled bar for nothing)
- **Severity Breakdown** — progress bars for High / Medium / Low severity
- **Weekly Trend** — line chart tracking Opened and Closed bugs per week, plus a red dotted **Rejected** line
- **Severity Bar Chart** — grouped bar chart with value labels
- **Activity Heatmap** — 91-day calendar heatmap of bug creation and update activity
- **My Bugs widget** — enter your name to see only your assigned bugs, with coloured status dot indicators

---

### Bug List View

- **Status distribution bar** — a horizontal multi-colour bar at the top showing the proportion of bugs in each of the 7 stages at a glance
- **Filter tab bar** — quick-access tabs (`All | New | Open | In Progress | In Review | Testing | Closed | Rejected`) each showing live bug counts, synced with the filter system
- **Expandable detail panel** — click any bug row to reveal:
  - **Visual status stepper** — linear flow `New → Open → In Progress → In Review → Testing → Closed` with past stages ticked, current stage highlighted, future stages greyed out
  - **Rejected branch** — shown as a separate red banner when a bug is rejected, not as part of the linear flow
  - **Move to Next Stage** button — advance the bug one step without opening a dropdown
  - **Status dropdown** — full 7-option dropdown to jump to any status
  - Comments thread and full activity log

---

### Kanban Board

- **7 columns** in lifecycle order: New · Open · In Progress · In Review · Testing · Closed · Rejected
- Each column header uses the correct status colour
- **Collapsible columns** — Closed and Rejected can be collapsed to a thin strip (showing count and rotated label) to save horizontal space
- **Drag-and-drop** cards between any column to change status
- Auto-scrolling per column for large backlogs
- Status change legend at the bottom

---

### Bug Form

- **Wizard mode** — 3-step form (Basic Info → Details → Attachments) with step progress indicator
- **Quick mode** — log a title and severity in seconds, fill in details later
- **Edit mode** — full 7-status dropdown available when editing an existing bug; status is intentionally hidden during creation (auto-set to New)
- **Auto-save draft** — form contents are saved to localStorage as you type; restored if you navigate away accidentally
- **Screenshot uploads** — drag-and-drop image attachments (react-dropzone)
- **Markdown preview** tab for descriptions
- Inline validation with per-field error messages

---

### Filter & Search

- **Global search** with live results dropdown as you type (searches title and description)
- Filter by **status**, **severity**, and **assignee** simultaneously
- **Saved filter presets** — name and save any filter combination for one-click reuse
- Active filter **chips** showing what is applied, each individually removable
- **Sort options** — newest, oldest, severity (high→low or low→high), status, assignee A–Z

---

### Notifications

- **Bell icon** with unread badge count
- In-app notification history (last 50 events)
- Toast notifications for every create, update, and delete action
- Status-change messages include the actor's name and specific stage, e.g.:
  - *"Bug #A1B2C3 moved to In Review by Alice"*
  - *"Bug #A1B2C3 is now in Testing"*
  - *"Bug #A1B2C3 is Closed and verified"*
  - *"Bug #A1B2C3 has been Rejected"*

---

### Activity Log

Every status change is automatically recorded as an activity log entry on the bug:

> *Status changed from In Progress to In Review by Alice on 29/05/2026*

Visible in the expanded detail panel for every bug.

---

### Other Features

- **Dark mode** — full dark theme toggle, persisted across sessions
- **Responsive design** — mobile bottom navigation bar (Add Bug, List/Kanban toggle, Notifications, Scroll-to-top); desktop header layout
- **Recently viewed** — quick-access strip showing the last 5 bugs you opened
- **Onboarding tour** — step-by-step guide shown on first visit, skippable
- **Keyboard shortcuts** — press `N` anywhere to open a new bug form; `Esc` to close it
- **Confirm modals** — destructive actions (delete) require confirmation
- **Skeleton loaders** — shown while bugs load from storage
- **Empty states** — contextual illustrations for "no bugs yet" and "no search results"

---

## Tech Stack

| Category | Library / Tool |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Toast notifications | React Toastify |
| File upload | React Dropzone |
| Date picker | React Datepicker |
| Drag and drop | React Beautiful DnD |
| Persistence | Browser localStorage |

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/your-username/Bug-Tracking-System.git
cd Bug-Tracking-System

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Other scripts

```bash
npm run build    # Production build
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

---

## Usage

### Creating a bug

1. Click **Add Bug** in the header (or press `N`)
2. Choose **Full Form** (3-step wizard) or **Quick** mode
3. Enter a title, description, severity, and assignee
4. Attach screenshots if needed
5. Submit — the bug is created with status **New** automatically

### Moving a bug through stages

- **List view**: expand a bug row → click **Move to Next Stage** or pick from the status dropdown
- **Kanban view**: drag the card to the target column
- **Edit form**: use the Status dropdown (all 7 options available)

### Filtering bugs

- Use the **tab bar** in the list view for quick single-status filtering
- Use the **Filters panel** above the list for combined status + severity + assignee filters
- Save any filter combination with the **Save filter** button for later reuse

### Tracking progress

- The **Dashboard** at the top of the page updates in real time as bugs change
- The **Status Breakdown card** gives a percentage breakdown across all 7 stages
- The **Activity Heatmap** shows when work was most active over the past 13 weeks

---

## Project Structure

```text
src/
├── components/
│   ├── App.tsx              # Root layout, routing, keyboard shortcuts
│   ├── BugForm.tsx          # Create / edit form (wizard + quick mode)
│   ├── BugList.tsx          # List view, tab bar, distribution bar, stepper
│   ├── KanbanBoard.tsx      # 7-column kanban with drag-and-drop
│   ├── Dashboard.tsx        # All charts and stat cards
│   ├── Filters.tsx          # Search, filter controls, saved presets
│   ├── ActivityLog.tsx      # Per-bug activity log
│   ├── Comments.tsx         # Per-bug comments thread
│   ├── NotificationBell.tsx # Bell + notification history dropdown
│   ├── OnboardingTour.tsx   # First-visit guided tour
│   ├── RecentlyViewed.tsx   # Recently opened bugs strip
│   └── ...                  # UI primitives (Tooltip, Modal, Skeletons…)
├── context/
│   ├── BugContext.tsx       # Global bug state, filtering, sorting, dispatch
│   └── ThemeContext.tsx     # Dark / light mode state
├── lib/
│   ├── statusConfig.ts      # 7-status config: colours, labels, lifecycle order
│   └── notifications.ts     # localStorage-backed pub/sub notification store
└── types/
    └── bug.ts               # Bug, Comment, ActivityLog, Status types
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request
