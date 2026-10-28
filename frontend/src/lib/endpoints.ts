/**
 * GymSlot Central REST Endpoints Catalog
 * Matches FastAPI Gateway v1 Routing
 */

export const ENDPOINTS = {
  // Authentication & Identity
  AUTH: {
    GOOGLE_LOGIN: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Student Portal
  STUDENT: {
    PROFILE: '/student/profile',
    ONBOARDING: '/student/onboarding',
    ALLOCATION: '/student/allocation',
    QR_PASS: '/student/qr-pass',
    SLOTS: '/student/slots',
    TRANSFER_APPLY: '/student/transfer/apply',
    TRANSFER_STATUS: '/student/transfer/status',
    ATTENDANCE: '/student/attendance',
    ATTENDANCE_SUMMARY: '/student/attendance/summary',
    COMPLAINTS: '/student/complaints',
  },

  // Gym Staff / Trainer Scanner
  STAFF: {
    SCAN_VALIDATE: '/staff/attendance/scan',
    MANUAL_CHECKIN: '/staff/attendance/manual',
    SESSION_ROSTER: (slotId: string, date: string) =>
      `/staff/sessions/${slotId}/roster?date=${encodeURIComponent(date)}`,
    LIVE_SESSIONS: '/staff/sessions/today',
  },

  // Sports Administration
  ADMIN: {
    FACILITIES: '/admin/facilities',
    FACILITY_DETAIL: (id: string) => `/admin/facilities/${id}`,
    SLOTS: '/admin/slots',
    SLOT_DETAIL: (id: string) => `/admin/slots/${id}`,
    WINDOWS: '/admin/windows',
    WINDOW_DETAIL: (id: string) => `/admin/windows/${id}`,
    TRANSFERS: '/admin/transfers',
    TRANSFER_ACTION: (id: string) => `/admin/transfers/${id}/action`,
    ATTENDANCE_AUDIT: '/admin/attendance/audit',
    ATTENDANCE_CORRECT: '/admin/attendance/correct',
    ABSENCE_MONITOR: '/admin/absence/monitor',
    RECLAIM_SLOT: (allocationId: string) => `/admin/absence/reclaim/${allocationId}`,
    COMPLAINTS: '/admin/complaints',
    COMPLAINT_RESPOND: (id: string) => `/admin/complaints/${id}/respond`,
    IMPORT_STUDENTS: '/admin/imports/students',
    IMPORT_SLOTS: '/admin/imports/slots',
    REPORTS_ATTENDANCE_CSV: '/admin/reports/attendance/csv',
    REPORTS_UTILIZATION_CSV: '/admin/reports/utilization/csv',
  },

  // Super Admin
  SUPER_ADMIN: {
    STAFF_LIST: '/super-admin/staff',
    PROVISION_STAFF: '/super-admin/staff/provision',
    REVOKE_STAFF: (id: string) => `/super-admin/staff/${id}/revoke`,
    SETTINGS: '/super-admin/settings',
    AUDIT_LOGS: '/super-admin/audit-logs',
  },
} as const;
