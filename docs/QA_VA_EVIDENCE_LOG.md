# QA and VA Evidence Log

Use this log to track screenshots, test results, configuration evidence, fixes, and retest proof for Software Quality Assurance and Vulnerability Assessment.

## QA Evidence

| ID | Area | Evidence Needed | File/Link | Status | Remarks |
| --- | --- | --- | --- | --- | --- |
| QA-01 | Staging access | HTTPS staging URL screenshot |  | Pending |  |
| QA-02 | Login | Google OAuth login test |  | Pending |  |
| QA-03 | Login | Email/password login test |  | Pending |  |
| QA-04 | Security | Account lockout after failed attempts |  | Pending |  |
| QA-05 | Roles | Admin role access | `frontend/src/components/layout/AppLayout.vue`, `frontend/src/views/DashboardView.vue` | Retested | Admin view now shows case monitoring, reports, user management, and audit logs; intake/registration is not presented as an Administrator operational module. |
| QA-06 | Roles | Case Worker role access | `frontend/src/router/index.js`, `frontend/src/stores/auth.js` | Retested | Case Worker remains the role allowed to access `/cases/new` for intake/registration. |
| QA-07 | Roles | FO User/LGU/CPU access differences | `frontend/src/stores/auth.js`, `appscript/Cases.gs` | Retested | Implementer roles can update assigned/covered cases; CPU monitor remains read-only. |
| QA-08 | Case workflow | Case intake/create |  | Pending |  |
| QA-09 | Case workflow | Case update/edit | `npm run build`; `appscript/Cases.gs` parser check | Retested | Frontend build passed; backend write handlers now enforce role plus case/region/province coverage. |
| QA-10 | Case workflow | Services and progress notes | `appscript/Cases.gs` | Retested | Services and notes now validate covered case access before writing. |
| QA-11 | Reports | Generate report and export |  | Pending |  |
| QA-12 | Audit | Export activity appears in audit logs |  | Pending |  |
| QA-13 | Public | Public dashboard shows aggregate-only data |  | Pending |  |
| QA-14 | Responsive | Mobile/tablet/desktop layout check |  | Pending |  |
| QA-15 | Build | `npm run build`; `npm audit --audit-level=high` | Partial | Production build passed. `npm audit` reports one high Vite dev-server advisory with no fix available; mitigation added in `vite.config.js`. |

## VA Evidence

| ID | Area | Evidence Needed | File/Link | Status | Remarks |
| --- | --- | --- | --- | --- | --- |
| VA-01 | Transport security | HTTPS/SSL active on staging/production URL |  | Pending |  |
| VA-02 | Security headers | `frontend/public/_headers`; `frontend/vite.config.js` | Retested | CSP, frame denial, content-type protection, referrer policy, and permissions policy are configured. |
| VA-03 | OAuth | Approved JavaScript origins/redirect URIs |  | Pending |  |
| VA-04 | Backend | Apps Script deployment settings |  | Pending |  |
| VA-05 | Data store | Restricted Google Sheets sharing permissions |  | Pending |  |
| VA-06 | Authentication | Session expiration/logout behavior |  | Pending |  |
| VA-07 | Password controls | Password policy and account lockout |  | Pending |  |
| VA-08 | Authorization | Backend role/coverage checks | `appscript/Code.gs`, `appscript/Cases.gs` | Fixed/Retested | Write actions require both allowed role and assigned case/region/province coverage. Admin is removed from operational location writes. |
| VA-09 | Input validation | Sanitization/validation evidence | `appscript/Code.gs`, `frontend/src/views/CaseFormView.vue` | Retested | Backend sanitization and request size limits present; phone/date/required-field validations are present in intake form. |
| VA-10 | Privacy | Privacy notice before intake |  | Pending |  |
| VA-11 | Export governance | Export purpose confirmation and logging |  | Pending |  |
| VA-12 | Public access | No case-level personal data in public views |  | Pending |  |

## Defect and Finding Remediation

| ID | Source | Finding / Defect | Severity | Fix / Action Taken | Evidence | Retest Result | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | VA | Backend write handlers allowed FO/LGU operational roles by role alone without verifying assigned case coverage. | High | Added `_canOperateOnCase()` checks to update, close/reopen, service, note, note update, and location handlers. | `appscript/Cases.gs`; parser check passed | Passed | Closed |
| 2 | QA | Cases export referenced missing `apiPost` import and stale filter variable names. | Medium | Imported `apiPost` and corrected export audit filter names. | `frontend/src/views/CasesView.vue`; `npm run build` passed | Passed | Closed |
| 3 | QA / Requirement | Admin UI implied access to case registry/update operations even though Admin does not perform intake/registration. | Medium | Reworked module labels and role helpers so Admin sees case monitoring only; intake/registration is Case Worker only. | `frontend/src/stores/auth.js`, `frontend/src/router/index.js`, `frontend/src/components/layout/AppLayout.vue`, `frontend/src/views/DashboardView.vue` | Passed | Closed |
| 4 | VA | Vite high-severity Windows dev-server advisory reported by `npm audit`; npm reports no fix available. | Medium | Added localhost binding, strict port, and server filesystem deny rules. Treat as dev-only residual risk; do not expose Vite dev server publicly. | `frontend/vite.config.js`; `npm audit --audit-level=high` | Residual | Open |
