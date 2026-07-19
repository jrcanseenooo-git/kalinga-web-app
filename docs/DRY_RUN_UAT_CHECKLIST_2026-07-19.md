# Kalinga CEFMU System Dry Run Checklist

Dry run date: July 19, 2026  
Audience: UNICEF representative, LGU representative, DSWD representative, and field Case Worker / Social Worker

## Test Accounts

All QA accounts use the password `Kalinga2026!`.

| View / Role | Test account | Expected presentation use |
|---|---|---|
| System Administrator | `qa.admin@dswd.gov.ph` | User roles, audit logs, reports, monitoring only. No intake/registration module. |
| Case Worker / Social Worker | `qa.caseworker@dswd.gov.ph` | Intake/registration, case management, referrals, services, progress notes, closure. |
| Field Office / DSWD Implementer | `qa.fouser@kalinga.local` | Regional monitoring, referral tracking, reports, case follow-up support. |
| LGU Supervisor / Implementer | `qa.supervisor@kalinga.local` | LGU monitoring, local follow-up, service/referral status review. |
| CPU Monitor | `qa.monitor@kalinga.local` | Read-only monitoring. Requires backend redeploy for province/region fallback access. |

## Suggested Demo Flow

1. Open the public dashboard.
   - Show aggregate-only data.
   - Explain that no personally identifiable client information is displayed publicly.

2. Log in as System Administrator.
   - Confirm visible modules: Dashboard, Case Monitoring, Reports, User Management, Audit Logs, Public Dashboard.
   - Confirm hidden modules: Intake / Registration and New Case.
   - Explain: System Administrator manages access and oversight but does not perform intake or case registration.

3. Log in as Case Worker / Social Worker.
   - Confirm visible modules: Dashboard, Case Management, Intake / Registration, Reports.
   - Open `CEFMU-202607-AE5F49`.
   - Show case details from intake to case plan.
   - Add or open Progress Notes / MDT Transfers.
   - Select Medical Officer / Nurse and show that only medical-related referral purposes appear.
   - Open Add service.
   - Select Medical and confirm Amount is hidden.
   - Select Financial and confirm Amount appears.

4. Log in as Field Office / DSWD Implementer.
   - Confirm visible modules: Dashboard, Referral Tracking, Reports.
   - Confirm no Intake / Registration and no User Management.
   - Confirm regional case visibility for the assigned area.

5. Log in as LGU Supervisor / Implementer.
   - Confirm visible modules: Dashboard, LGU Monitoring, Reports.
   - Confirm no Intake / Registration and no User Management.
   - Confirm assigned-area case visibility.

6. Discuss GIDA / low-connectivity field use.
   - Show offline indicator behavior if available.
   - Explain queued offline case creation and automatic sync on reconnect.
   - Explain that field users should avoid shared devices and should sync before leaving connectivity areas.

## Dry Run Evidence

API authentication passed for all five QA accounts.

| Role | API login | getCases result |
|---|---:|---|
| Admin | Passed | 3 cases |
| Case Worker | Passed | 1 case: `CEFMU-202607-AE5F49` |
| Field Office | Passed | 1 case: `CEFMU-202607-AE5F49` |
| LGU Supervisor | Passed | 1 case: `CEFMU-202607-AE5F49` |
| CPU Monitor | Passed | 1 case: `CEFMU-202607-AE5F49` |

Other checks:

- Public dashboard API passed with total 3 cases.
- Case detail API passed for `CEFMU-202607-AE5F49` with notes, service, and family data.
- Frontend production build passed.
- Browser smoke test passed for dashboard area filter UI, referral purpose filtering, and service amount visibility.

## Known Gaps Before Live Presentation

1. Google OAuth local testing still needs authorized JavaScript origins if Google sign-in will be demonstrated from localhost.
   - Email/password QA login is ready for dry run.

2. Avoid rapid repeated login attempts during the live presentation. The backend includes request throttling for authentication routes.

## Live Deployment Verification

- Existing Apps Script deployment ID remained unchanged: `AKfycby8TMwYFpmfZoX0VXVi-YKUrCAv-caVlUcplonXQ1ho5_YsBC1YERlzLdTTlLr_hFXIqQ`
- Active Apps Script deployment: `Kalinga_deploy_v42`
- Dashboard filter check passed: all cases = 3, Region II = 1.
- All QA role accounts returned expected case access after deployment.

## Presentation Talking Points

- The system is CEFMU-only for the pilot but structured as a future child protection case management platform.
- The flow supports intake, case registry, case monitoring, MDT referral tracking, services provided, reporting, and closure.
- Role-based access limits operational modules by function.
- Client names are masked in case lists by default to support data privacy.
- Public dashboards show aggregate statistics only.
- Offline queue support helps GIDA field workers capture cases when connectivity is low, then sync later.
