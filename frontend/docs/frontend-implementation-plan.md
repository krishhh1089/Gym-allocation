**# GymSlot — Frontend Implementation Plan (React.js SPA)**



**\*\*Architecture:\*\*** Pure React.js (React 18+ / Vite / TypeScript) — *\*No Next.js\**  

**\*\*Design System:\*\*** \`page-is-the-object\` Tactile University Stationery (\`Zilla Slab\` + Collegiate Green \`#2e4a3e\`)  

**\*\*Target Delivery:\*\*** Progressive Web App (PWA) + Container-Ready SPA (Nginx)  

**\*\*Location:\*\*** \`frontend/docs/frontend-implementation-plan.md\`



\---



**## 📋 Executive Overview & Workflow Policy**



This plan lays out the complete, step-by-step roadmap to implement the entire **\*\*GymSlot\*\*** frontend in **\*\*pure React.js\*\***. Every phase is broken down into atomic steps with explicit **\*\*Verification & Review Checkpoints\*\*** so the user can test, inspect, and approve all work at each milestone before proceeding to the next.



\`\`\`mermaid

graph TD

    P0["Phase 0: Project Setup & Tooling (Vite + React + TS)"] --> P1["Phase 1: Design System Tokens & Base Primitives"]

    P1 --> P2["Phase 2: Auth, Session & API Layer (Google OAuth + JWT)"]

    P2 --> P3["Phase 3: Public Landing & Student Onboarding"]

    P3 --> P4["Phase 4: Student QR Code"]

    P4 --> P5["Phase 5: Slot Browser, Waitlists & Transfer Engine"]

    P5 --> P6["Phase 6: Attendance History & Support Tickets"]

    P6 --> P7["Phase 7: Gym Staff QR Scanner"]

    P7 --> P8["Phase 8: Sports Admin Management & Audit Center"]

    P8 --> P9["Phase 9: Absence Reclamation & Retention Engine"]

    P9 --> P10["Phase 10: Bulk Excel Import Hub & Analytics Export"]

    P10 --> P11["Phase 11: Super Admin & System Controls"]

    P11 --> P12["Phase 12: Production Build, PWA & Dockerization"]

\`\`\`



\---



**## 🚀 Phase 0: Project Scaffolding & Tooling (React.js + Vite)**



**### Step 0.1 — Initialize Vite React + TypeScript App**

\- **\*\*Action:\*\*** Scaffold clean React 18+ app using Vite in \`frontend/\` (or update existing directory structure).

\- **\*\*Core Dependencies:\*\***

  - \`react\`, \`react-dom\`, \`react-router-dom\` (v6+)

  - \`typescript\`, \`@types/react\`, \`@types/react-dom\`

  - \`@tanstack/react-query\`, \`zustand\`

  - \`axios\`, \`zod\`, \`react-hook-form\`, \`@hookform/resolvers\`

  - \`html5-qrcode\`, \`qrcode.react\`

  - \`lucide-react\` (curated geometric glyphs)

\- **\*\*Files to Create:\*\***

  - \`frontend/package.json\`

  - \`frontend/vite.config.ts\` (with path alias \`@/\*\` -> \`./src/\*\` and dev proxy to \`:8000\`)

  - \`frontend/tsconfig.json\`

  - \`frontend/index.html\` (with Google Font \`Zilla Slab\` 400/500/600 preloaded)

\- 🔍 **\*\*User Verification Checkpoint 0.1:\*\***

  - Run \`npm run dev\` in \`frontend/\`.

  - Open \`http\://localhost:5173\` in browser.

  - Verify zero console errors, Vite HMR active, and TypeScript strict mode passes (\`npm run build\`).



\---



**## 🎨 Phase 1: Design System Tokens & Base Primitives** *(Completed & Verified)*

### Step 1.1 — CSS Token System & Typography Engine `[COMPLETED]`
- **Action:** Implement global token foundation from [`02-design-system.md`](02-design-system.md) in `src/styles/tokens.css` and `src/styles/globals.css`.
- **Tokens Included:**
  - Warm stone ground (`--bg: #eeecea`), ledger surface (`--surface: #e4e1dd`), paper card (`--card-paper: #e8e5e0`).
  - SRM-AP collegiate athletic forest green (`--accent: #2e4a3e`).
  - Status accents (`--status-present`, `--status-absent`, `--status-late`, `--status-waitlist`, `--status-pending`, `--status-reclaimed`).
  - Fluid typography clamp scale (`--step-small` to `--step-display`) in `Zilla Slab`.
  - Tabular figure utility (`.nums` / `font-variant-numeric: tabular-nums`).
- **Files Created/Refined:**
  - `src/styles/tokens.css`
  - `src/styles/globals.css`

### Step 1.2 — Atomic Component Primitives `[COMPLETED]`
- **Action:** Build reusable anti-slop atomic components without generic borders or floating shadows.
- **Components Built:**
  - `Button` (Primary athletic green `#2e4a3e`, secondary paper tint `#cdc3b6`, danger `#9e2a2b`, outline, ghost, loading/disabled state, active `translate(2px, 2px)`).
  - `Input` (Tactile 3px focus ring, error message, high-contrast text, monospace AP formatting).
  - `Badge` (Square-cornered status tag for `PRESENT`, `ABSENT`, `ACTIVE`, `WAITLISTED`, `PENDING`, `RECLAIMED`, `CANCELLED`).
  - `FolderTabs` (Physical filing tab strip with active sheet coupling, keyboard arrow navigation, badges).
  - `Modal` (`data-ui` scoped dialog with backdrop scrim, keyboard escape dismissal, accessible dialog).
  - `PerforatedSlip` (Container with circular edge punch-outs, dashed tear line, ticket stub).
- **Files Created:**
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Input.tsx`
  - `src/components/ui/Badge.tsx`
  - `src/components/ui/FolderTabs.tsx`
  - `src/components/ui/Modal.tsx`
  - `src/components/ui/PerforatedSlip.tsx`
  - `src/components/ui/index.ts`
  - `src/pages/public/ComponentShowcase.tsx` (Interactive test suite at `/components`)
- 🔍 **User Verification Checkpoint 1:** `[VERIFIED]`
  - Review component story/test page rendering buttons, badges, tabs, and perforated slips at `http://localhost:5173/components`.
  - Test keyboard focus rings (`Tab` key navigates with 3px solid `--accent` indicator).
  - Check WCAG contrast with DevTools (all text passes 7:1+ contrast). Verified in live browser.



\---



**## 🔐 Phase 2: Auth, Session & API Gateway Integration** *(Completed & Verified)*

### Step 2.1 — API Client & Axios Interceptor `[COMPLETED]`
- **Action:** Configure central HTTP client targeting the `/api/v1` FastAPI Gateway with automatic JWT token refresh.
- **Capabilities:**
  - Bearer token injection on authenticated endpoints from Zustand store.
  - Automatic 401 interception: triggers `/api/v1/auth/refresh` or clean logout redirect.
  - Standardized error formatting (Pydantic validation error parsing via `parseApiError`).
- **Files Created:**
  - `src/types/api.ts`
  - `src/lib/endpoints.ts`
  - `src/lib/api-client.ts`

### Step 2.2 — Google OAuth 2.0 & Session Store (Zustand) `[COMPLETED]`
- **Action:** Implement authentication store and OAuth callback handler strictly validating `@srmap.edu.in`.
- **State Properties:**
  - `user`: `{ id, email, full_name, role, ap_number, is_active }`
  - `isAuthenticated`: `boolean`
  - `token`: `string | null`
  - `devSwitchRole()`, `logout()`, `hasRole()`
- **Files Created:**
  - `src/stores/useAuthStore.ts`
  - `src/pages/auth/Login.tsx` (with "Continue with SRM-AP Google Account", `@srmap.edu.in` domain lock, and quick role switcher)
  - `src/pages/auth/AuthCallback.tsx` (exchanges authorization code, validates `@srmap.edu.in`, and redirects by role)
  - `src/components/auth/ProtectedRoute.tsx` (Role-based route guard for `STUDENT`, `STAFF`, `TRAINER`, `ADMIN`, `SUPER_ADMIN` with tactile 403 Forbidden Slate)
- 🔍 **User Verification Checkpoint 2:** `[VERIFIED]`
  - Tested login flow with role switcher & Google SSO callback.
  - Attempted accessing `/admin/dashboard` as a `STUDENT` -> verified immediate 403 Forbidden Slate with clear recovery actions.
  - Tested switching to `ADMIN` -> immediately permitted access to `/admin/dashboard`.
  - Tested Sign Out -> successfully cleared session back to guest state. (Verified via automated browser test).



\---



**## 🏛️ Phase 3: Public Landing Page & Student Onboarding** *(Completed & Verified)*

### Step 3.1 — Public Landing Page (React Version) [COMPLETED]
- **Action:** Port the audited, anti-slop landing page into a modular React component tree.
- **Sections Included:**
  - University Masthead with Google OAuth login trigger.
  - Hero Tabbed Folder with Facility previews (C. V. Raman, Ganga, Krishna, Narmada) using curated photography.
  - Interactive Simulator component (QRPreviewSimulator) demonstrating the 4-attribute payload.
  - Four Foundational Safeguards (3-Day absence rule, FCFS queue, dynamic QR, audit precision).
  - Official Session Timetable with capacity breakdown.
  - Institutional Footer with open-access athletic archive credits.
- **Files Created:**
  - src/pages/public/LandingPage.tsx
  - src/components/landing/HeroFolder.tsx
  - src/components/landing/QRPreviewSimulator.tsx
  - src/components/landing/TimetableCard.tsx

### Step 3.2 — Student Profile Onboarding [COMPLETED]
- **Action:** Build onboarding screen for first-time students after Google OAuth login.
- **Displayed Details & Scenarios:**
  - Read-only AP number (AP22110010045), name, and college email from verified student record.
  - Active gym allocation scenario with official admission slip pass and timetable details.
  - No active allocation scenario with upcoming registration window notice and browse slots CTA.
  - Unmatched roster scenario with database exception alert and Sports Department office resolution steps.
- **Files Created:**
  - src/pages/student/Onboarding.tsx
- 🔍 **User Verification Checkpoint 3:** [VERIFIED]
  - Opened landing page at http://localhost:5173/landing -> Tested facility tabs, photos, and interactive QR simulator.
  - Tested /onboarding across all 3 scenarios (Active allocation, No allocation, Unmatched roster). (Verified via browser subagent with video recording).

---

**## 🔳 Phase 4: Student QR Code** *(Completed & Verified)*

### Step 4.1 — Student QR Code Display [COMPLETED]
- **Action:** Build a QR code page for students with an active gym allocation.
- **QR Payload Fields:**
  - Student AP number (student_ap_number)
  - College email (college_email)
  - Session date (session_date)
  - Slot start time and end time (slot_timing)
- **Key Capabilities:**
  - Generate the QR dynamically from student's allocation and selected session date (Today, Tomorrow, or custom date).
  - High-contrast tactile admission slip presentation with perforated edges and ticket tear-off stub.
  - Used qrcode.react (QRCodeSVG) with level M error correction.
  - Interactive allocation state toggle (ACTIVE vs NONE) rendering the empty state notice when student has no active reservation.
  - Untrusted input principle: Payload contains 4 fields and is dynamically validated against database records when scanned at turnstile. Zero offline caching.
- **Files Created:**
  - src/components/qr/StudentQRCode.tsx
  - src/pages/student/QRCodePage.tsx
- 🔍 **User Verification Checkpoint 4:** [VERIFIED]
  - Navigated to /student/qr-code.
  - Verified QR payload contains only AP number, college email, session date, and slot timing.
  - Verified date selector dynamically switches sessions (Today vs Tomorrow).
  - Verified empty state handling when allocation is toggled off. (Verified via automated browser test).

---

**## 🏋️ Phase 5: Slot Browser, Waitlists & Transfer Engine** *(Completed & Verified)*

### Step 5.1 — Facility Slot Browser & Live Capacity Gauges `[COMPLETED]`
- **Action:** Build facility browser across all 4 SRM-AP gym complexes with real-time occupancy.
- **Controls & States:**
  - Tabs: `All Facilities`, `C. V. Raman Gym`, `Ganga Fitness Hub`, `Krishna Conditioning`, `Narmada Strength`.
  - Batch period filters (`All Batches`, `Morning Only`, `Evening Only`) and `Show Available Slots Only` toggle.
  - Slot cards with visual progress bar (`CapacityGauge`) showing occupancy and color-coded threshold alerts.
  - Dynamic button states: `Allocated to You` (disabled), `Apply for Slot Allocation` (when student has no slot), `Request Transfer to Slot` (when student has existing slot), and `Join FCFS Waitlist` (when capacity == 100% full with queue position).
- **Files Created:**
  - `src/components/slots/CapacityGauge.tsx`
  - `src/components/slots/SlotCard.tsx`
  - `src/pages/student/SlotBrowserPage.tsx`

### Step 5.2 — Protected Slot Transfer Request Engine `[COMPLETED]`
- **Action:** Build the transfer request workflow allowing students with active slots to apply for a swap without risking their current seat.
- **Key Features:**
  - Side-by-side ledger comparing **Current Slot** vs **Target Slot** via `TransferComparisonLedger`.
  - Prominent Protected Transfer Guarantee banner: *"Your current gym slot remains 100% active and secured. You will not lose your current workout timing unless your transfer is confirmed."*
  - Reason selector dropdown (`Academic Class Timetable Clash`, `Lab / Project Schedule Changed`, `Hostel Block Relocation`, `Medical / Rehabilitation Goal`, `Sports Team Practice Session`).
  - Remarks textarea with 250 character limit counter.
  - Interactive submission state updating to `IN REVIEW` status with ticket reference `#TR-2026-AP0045` and `Withdraw Transfer Request` control.
- **Files Created:**
  - `src/components/slots/TransferComparisonLedger.tsx`
  - `src/pages/student/SlotTransferPage.tsx`
- 🔍 **User Verification Checkpoint 5:** `[VERIFIED]`
  - Switched between facility tabs and tested period filters at `/student/slots`.
  - Tested joining FCFS waitlist modal on full batch M2 at position #8.
  - Clicked transfer on open batch E1 -> redirected to `/student/transfer`.
  - Verified Protected Guarantee banner and side-by-side comparison ledger.
  - Submitted transfer request -> verified `IN REVIEW` card appeared and tested `Withdraw Transfer Request`. (Verified via browser subagent with video recording).

---

**## 📅 Phase 6: Attendance History, Absence Risk & Complaints [COMPLETED]**



**### Step 6.1 — Student Attendance Ledger & Absence Barometer**

\- **\*\*Action:\*\*** Build historical calendar and ledger view with absence risk calculation.

\- **\*\*Features:\*\***

  - Weekly streak badge (\`4/5 sessions\`).

  - **\*\*Absence Risk Barometer:\*\***

    - Green (0–1 absence): Good standing.

    - Amber (2 absences): Warning banner.

    - Red striped (3 absences): Critical alert (*\*1 absence away from automated reclamation\**).

  - Attendance table with status pills (\`PRESENT\`, \`ABSENT\`, \`LATE\`, \`EXCUSED\`).

  - Exemption reason popover.

\- **\*\*Files to Create:\*\***

  - \`src/pages/student/AttendancePage.tsx\`

  - \`src/components/attendance/AbsenceBarometer.tsx\`

  - \`src/components/attendance/AttendanceTable.tsx\`



**### Step 6.2 — Student Support & Complaints Desk**

\- **\*\*Action:\*\*** Build ticketing interface for reporting scanner clashing, wrong absences, or facility issues.

\- **\*\*Features:\*\***

  - Ticket submission modal with category selector.

  - Active tickets list with status pills (\`OPEN\`, \`IN_PROGRESS\`, \`RESOLVED\`).

  - Chronological message thread with Sports Staff replies.

\- **\*\*Files to Create:\*\***

  - \`src/pages/student/ComplaintsPage.tsx\`

  - \`src/components/complaints/ComplaintModal.tsx\`

  - \`src/components/complaints/TicketThread.tsx\`

\- 🔍 **\*\*User Verification Checkpoint 6:\*\***

  - Inspect attendance ledger and verify absence meter shifts states based on simulated absence count.

  - Submit a test support ticket and verify conversation thread renders correctly.



\---



**## 📷 Phase 7: Gym Staff QR Scanner App [COMPLETED]**

**### Step 7.1 — Camera QR Scanner (\`html5-qrcode\`)**

\- **\*\*Action:\*\*** Implement a mobile/tablet camera scanner for gym staff.

\- **\*\*Capabilities:\*\***

  - Camera selection and flashlight toggle where supported.

  - Scan QR payload containing AP number, college email, session date, and slot timing.

  - Send scanned data to \`POST /api/v1/attendance/scan\` for server-side validation.

\- **\*\*Files to Create:\*\***

  - \`src/pages/staff/QRScannerPage.tsx\`

  - \`src/components/scanner/CameraViewport.tsx\`

  - \`src/hooks/useQRScanner.ts\`

**### Step 7.2 — Scan Result and Attendance Confirmation**

\- **\*\*Action:\*\*** Display verified student and session information after the backend validates the QR data.

\- **\*\*Overlay Elements:\*\***

  - Student name and AP number from the official record.

  - College email.

  - Assigned gym and slot timing, verified from the official allocation.

  - Session date and attendance status.

  - \`CONFIRM ENTRY\` and \`REJECT\` actions where staff confirmation is required.

\- **\*\*Exception Guards:\*\***

  - Reject an unknown AP number or AP/email mismatch.

  - Reject an inactive allocation, wrong gym/slot, or wrong session date.

  - Show an \`Already Checked In\` message for duplicate scans.

**### Step 7.3 — Manual AP Lookup and Session Roster**

\- **\*\*Action:\*\*** Provide authorized manual AP number search when the camera or student's phone is unavailable.

\- **\*\*Files to Create:\*\***

  - \`src/pages/staff/ManualCheckInPage.tsx\`

  - \`src/pages/staff/SessionRosterPage.tsx\`

\- 🔍 **\*\*User Verification Checkpoint 7:\*\***

  - Open \`/staff/scanner\` on a phone or webcam and scan a student QR.

  - Verify the backend checks the student's allocation and session before recording attendance.

  - Scan the same QR twice and confirm duplicate attendance is prevented.





**## 📊 Phase 8: Sports Administrator Management & Audit Center**



**### Step 8.1 — Sports Admin Executive Dashboard**

\- **\*\*Action:\*\*** Build real-time analytics command center.

\- **\*\*KPI Widgets:\*\***

  - Real-time campus facility occupancy (%).

  - Today's completed check-ins vs total expected.

  - High-risk students counter (3 absences).

  - Pending queues: New slot applications and slot-change requests.

\- **\*\*Files to Create:\*\***

  - \`src/pages/admin/AdminDashboard.tsx\`

  - \`src/components/admin/MetricCard.tsx\`

  - \`src/components/admin/FacilityOccupancyBar.tsx\`



**### Step 8.2 — Facility, Slot & Schedule Management**

\- **\*\*Action:\*\*** CRUD interface for gyms, slot recurrence schedules (\`slot_schedules\`), and capacities.

\- **\*\*Files to Create:\*\***

  - \`src/pages/admin/FacilitiesPage.tsx\`

  - \`src/components/admin/SlotScheduleModal.tsx\`



**### Step 8.3 — Registration Windows Engine**

\- **\*\*Action:\*\*** Controls for scheduling semester registration windows with daily active hours and IST timezone lock.

\- **\*\*Files to Create:\*\***

  - \`src/pages/admin/RegistrationWindowsPage.tsx\`



**### Step 8.4 — Attendance Audit & Correction Modal**

\- **\*\*Action:\*\*** Dense attendance ledger with authorized edit modal.

\- **\*\*Audit Rules:\*\***

  - Changing status requires mandatory reason note.

  - Logs edit to \`attendance_corrections\` table with admin identity and timestamp.

\- **\*\*Files to Create:\*\***

  - \`src/pages/admin/AttendanceAuditPage.tsx\`

  - \`src/components/admin/AttendanceCorrectionModal.tsx\`

\- 🔍 **\*\*User Verification Checkpoint 8:\*\***

  - Open admin dashboard -> Verify KPIs and occupancy charts load.

  - Open attendance ledger -> Trigger a correction modal, submit an edit, and verify the audit reason is captured.



\---



**## ⚖️ Phase 9: Absence Monitoring and Allocation Management**

**### Step 9.1 — Absence Policy and Retention Monitor**

\- **\*\*Action:\*\*** Build the admin view for monitoring attendance and handling allocations under the approved absence policy.

\- **\*\*Features:\*\***

  - Configurable consecutive absence threshold, subject to the Sports Department's approved policy.

  - List of students approaching or meeting the warning/termination threshold.

  - Send warning notifications through enabled channels.

  - Termination history and vacancy release tracking.

  - Preserve allocation and attendance history.

\- **\*\*Files to Create:\*\***

  - \`src/pages/admin/AbsenceMonitorPage.tsx\`

\- 🔍 **\*\*User Verification Checkpoint 9:\*\***

  - Verify at-risk students are flagged according to the configured policy.

  - Confirm repeated job runs do not create duplicate warnings or terminations.





**## 📥 Phase 10: Bulk Excel Import Hub & Reports Export**



**### Step 10.1 — Excel & CSV Bulk Import Hub**

\- **\*\*Action:\*\*** Drag-and-drop wizard for bulk slot creation and student enrollments.

\- **\*\*Capabilities:\*\***

  - Upload \`.xlsx\` / \`.csv\`.

  - Dry-run validation preview table flagging malformed AP numbers or email errors in red.

  - One-click \`Commit Import\` with transactional safety.

\- **\*\*Files to Create:\*\***

  - \`src/pages/admin/BulkImportPage.tsx\`

  - \`src/components/admin/ImportPreviewTable.tsx\`



**### Step 10.2 — Analytics & Compliance Export**

\- **\*\*Action:\*\*** Filterable report builder with one-click download in CSV or Excel format.

\- **\*\*Files to Create:\*\***

  - \`src/pages/admin/ReportsExportPage.tsx\`

\- 🔍 **\*\*User Verification Checkpoint 10:\*\***

  - Upload sample slot Excel workbook -> Check validation preview catches format errors.

  - Export attendance report -> Confirm CSV downloads with clean headers.



\---



**## 🛡️ Phase 11: Super Admin & System Security Controls**



**### Step 11.1 — Staff Provisioning & Role Delegation**

\- **\*\*Action:\*\*** Table of university staff with role dropdown (\`TRAINER\`, \`ADMIN\`, \`SUPER_ADMIN\`).

\- **\*\*Files to Create:\*\***

  - \`src/pages/super-admin/StaffManagementPage.tsx\`



**### Step 11.2 — Institutional Settings & Domain Rules**

\- **\*\*Action:\*\*** Configure \`@srmap.edu.in\` domain validation, session timeout, and timezone.

\- **\*\*Files to Create:\*\***

  - \`src/pages/super-admin/SystemSettingsPage.tsx\`



**### Step 11.3 — Immutable Audit Trail Inspector**

\- **\*\*Action:\*\*** Searchable log viewer with expandable JSON diff viewer (\`before_state\` vs \`after_state\`) and correlation IDs.

\- **\*\*Files to Create:\*\***

  - \`src/pages/super-admin/AuditTrailPage.tsx\`

  - \`src/components/admin/JsonDiffViewer.tsx\`

\- 🔍 **\*\*User Verification Checkpoint 11:\*\***

  - Test assigning a trainer role -> Check the audit trail records the assignment event with before/after state.



\---



**## 🚢 Phase 12: Production Readiness, PWA & Dockerization**



**### Step 12.1 — Progressive Web App (PWA) Installability**

\- **\*\*Action:\*\*** Configure \`manifest.json\` for Add-to-Home-Screen. Do not cache QR codes or sensitive student information for offline use.

\- **\*\*Files to Create:\*\***

  - \`frontend/public/manifest.json\`

  - \`frontend/public/sw\.js\`



**### Step 12.2 — Production Multi-Stage Dockerfile & Nginx Configuration**

\- **\*\*Action:\*\*** Build lightweight production Docker container with Nginx alpine runner (<30MB) and camera permissions header.

\- **\*\*Files to Create:\*\***

  - \`frontend/Dockerfile\`

  - \`frontend/nginx.conf\`

  - Update root \`docker-compose.yml\` to include \`frontend\` service on port 3000.



**### Step 12.3 — End-to-End Build & Lint Verification**

\- **\*\*Action:\*\*** Run full production build, TypeScript typecheck, and \`lint.mjs\` taste-skill audit.

\- 🔍 **\*\*User Verification Checkpoint 12:\*\***

  - Run \`docker compose build frontend\` -> Verify image compiles cleanly.

  - Run \`docker compose up -d frontend\` -> Access \`http\://localhost:3000\`.

  - Audit PWA installability in Chrome DevTools -> Lighthouse score > 90 across Performance and PWA.



\---



**## 📌 Implementation Progress Tracker**



\| Phase | Milestone | Estimated Tasks | Status | Verified by User |

\| :--- | :--- | :---: | :---: | :---: |

\| **Phase 0** | Project Scaffolding (Vite + React + TS) | 2 | ✅ Completed | [x] |

\| **\*\*Phase 1\*\*** | Design System Tokens & Atomic Primitives | 2 | ⏳ Pending | [ ] |

\| **\*\*Phase 2\*\*** | Auth, Session & API Gateway Layer | 2 | ⏳ Pending | [ ] |

\| **\*\*Phase 3\*\*** | Public Landing & Student Onboarding | 2 | ⏳ Pending | [ ] |

\| **\*\*Phase 4\*\*** | Student QR Code | 2 | ⏳ Pending | [ ] |

\| **\*\*Phase 5\*\*** | Slot Browser, Waitlists & Transfer Engine | 2 | ⏳ Pending | [ ] |

\| **\*\*Phase 6\*\*** | Attendance History & Support Tickets | 2 | ⏳ Pending | [ ] |

\| **\*\*Phase 7\*\*** | Gym Staff QR Scanner App | 3 | ⏳ Pending | [ ] |

\| **\*\*Phase 8\*\*** | Sports Admin Management & Audit Center | 4 | ⏳ Pending | [ ] |

\| **\*\*Phase 9\*\*** | Absence Monitoring and Allocation Management | 2 | ⏳ Pending | [ ] |

\| **\*\*Phase 10\*\*** | Bulk Excel Import Hub & Reports Export | 2 | ⏳ Pending | [ ] |

\| **\*\*Phase 11\*\*** | Super Admin & System Security Controls | 3 | ⏳ Pending | [ ] |

\| **\*\*Phase 12\*\*** | Production Build, PWA & Dockerization | 3 | ⏳ Pending | [ ] |
