# Project Kalinga Deployment Documentation Tracker

This tracker organizes the documents and evidence needed for ICTMS deployment, Software Quality Assurance (SQA), Vulnerability Assessment (VA), data privacy review, and User Acceptance Testing (UAT).

## Submission Status

| Area | Deliverable | Current Source | Status | Remaining Action |
| --- | --- | --- | --- | --- |
| IS Documentation | Full Information System Documentation | Google Doc: Kalinga IS Documentation - Draft | In progress | Final formatting, TOC/page numbers, review sign-off |
| User Guide | End-user guide/manual | `docs/docx/02-User-Manual.docx` and embedded IS manual reference | Drafted | Confirm access-level instructions per role |
| Installation Guide | Installation and Deployment Guide | Embedded in IS Documentation section 10.3 | Drafted | Confirm final staging/production URLs and deployment account |
| SQA | SQA Test Plan | `docs/docx/04-SQA-Test-Plan.docx` | Drafted | Confirm test schedule, assigned tester, and test environment |
| SQA | SQA Test Cases | `docs/docx/05-SQA-Test-Cases.docx` | Drafted | Execute tests and record pass/fail evidence |
| SQA | SQA Compliance Checklist | `docs/docx/06-SQA-Compliance-Checklist.docx` | Drafted | Mark final complied/not complied status after test execution |
| SQA | SQA Test Report / Addressed QA Report | `docs/docx/07-SQA-Test-Report.docx` | Drafted | Fill actual execution results, defects, fixes, retest status, and sign-off |
| VA | VA Security Compliance Checklist | `docs/docx/08-VA-Security-Compliance-Checklist.docx` | Drafted | Validate against staging URL and attach evidence |
| VA | Addressed Vulnerability Assessment Report | To be issued after VA | Pending external result | Fix findings, document evidence, request retest/validation |
| Requirements | User Stories | `docs/docx/09-User-Stories.docx` | Drafted | Confirm stories match deployed scope/MVP |
| Deployment | Deployment Compliance Checklist | DSWD-ICTMS-GF-018 template | Pending | Fill project details, access/deployment modality, QA/VA status, UAT completion |
| Deployment | Endorsement memorandum/request for deployment | To be prepared | Pending | Address to ICTMS/Regional Director following office instruction |
| Deployment | Code repository and branches | GitHub repository | Needs confirmation | Confirm develop, staging, and production branch workflow |
| Deployment | Walkthrough on installation procedures and system overview | IS Documentation section 10.3 plus demo | Pending | Prepare short walkthrough schedule or demo script |
| UAT | UAT completion for MVP | To be prepared | Pending | Collect stakeholder sign-off after MVP walkthrough/testing |
| Privacy | PIA/privacy memo/supporting documents | Data Privacy Manual guidance and project privacy notes | Pending | Prepare PIA memo/supporting privacy review documents through RISO/DPO path |

## Pre-QA Package

Before requesting QA, prepare and share:

- Working staging URL over HTTPS.
- Test accounts for each role: Admin, Case Worker, FO User, LGU Supervisor, CPU Monitor, and public/no-login access.
- Synthetic test data only; no real client records in staging.
- IS Documentation.
- User Manual.
- User Stories.
- SQA Test Plan.
- SQA Test Cases.
- SQA Compliance Checklist.
- Known limitations and out-of-scope items for the MVP.

## QA Execution Checklist

QA should cover:

- Authentication: Google OAuth, email/password login, logout, session expiry, account lockout, password change.
- Authorization: role-based menu visibility, route guards, backend role checks, coverage filtering.
- Case workflows: intake, edit, family composition, service records, progress notes, referrals, closure/reopening.
- Dashboard and reporting: filters, aggregate counts, CSV/summary exports, purpose-of-export confirmation.
- Audit logs: login activity, failed attempts, account locks, blocked actions, exports, user management actions.
- Public access: public dashboard and FAQ only; no case-level personal information.
- Compatibility: Chrome/Edge/Firefox, desktop/mobile responsiveness.
- Offline/PWA: cached view behavior and queued actions where enabled.
- Privacy notices: intake privacy notice and export warning.

## Post-QA Package

After QA, prepare:

- SQA Test Report with actual test execution results.
- Defect log showing severity, module, steps to reproduce, expected result, actual result, fix owner, and status.
- Evidence of fixes such as screenshots, commit references, or retest notes.
- Addressed QA Report once defects are resolved.
- QA sign-off or recommendation for VA/UAT/deployment.

## Pre-VA Package

Before VA, prepare and share:

- Staging/testing URL secured with HTTPS/SSL.
- API/backend endpoint or Apps Script deployment URL.
- Testing accounts for every role.
- IS Documentation.
- User Manual.
- Installation and Deployment Guide embedded in the IS Documentation.
- VA Security Compliance Checklist.
- Security control evidence: headers, authentication controls, RBAC, session expiration, lockout, audit logs, export logging, privacy notices, input sanitization, and restricted spreadsheet sharing.
- Data privacy support documents or PIA memo route, as advised by RISO/DPO.

## VA Focus Areas

VA should review:

- HTTPS/SSL and approved domain/origin configuration.
- Authentication and session management.
- Password policy, account lockout, and session invalidation.
- Role-based access control and backend authorization.
- Data exposure controls for case records and public dashboard.
- Input validation and sanitization.
- Security headers and Content Security Policy.
- Error handling and prevention of sensitive error disclosure.
- Audit trail and export accountability.
- Environment variables and secret handling.
- Google Sheets sharing permissions and Apps Script deployment access.

## Post-VA Package

After VA, prepare:

- Vulnerability Assessment Report from ICTMS/RISO.
- Remediation plan for each finding.
- Evidence of fixes and configuration changes.
- Retest request or validation response.
- Addressed Vulnerability Assessment Report.
- Final security clearance or recommendation for deployment.

## Deployment Compliance Checklist Mapping

| GF-018 Item | Project Kalinga Evidence |
| --- | --- |
| Endorsement Memorandum / Email Ticket | Pending deployment request memo and email/ticket |
| Comprehensive System Documentation | Master IS Documentation Google Doc |
| Code Repository | GitHub repository with agreed branches |
| Technology Stack | Vue 3, Vite, Tailwind CSS, Pinia, Vue Router, Vercel, Google Apps Script, Google Sheets |
| System Architecture | IS Documentation sections 2 and 3 |
| Installation Guide | IS Documentation section 10.3 |
| Installation Walkthrough / System Overview | IS Documentation section 10.3 plus walkthrough demo |
| Preferred Domain / API | Pending final production domain and Apps Script API URL |
| Change Request Forms | Pending, if deployment changes require formal change request |
| Addressed QA Report | Pending after QA execution and remediation |
| Addressed VA Report | Pending after VA execution and remediation |
| Access Modality | Public access for aggregate dashboard/FAQ; restricted login for operational modules |
| Deployment Modality | Cloud/serverless: Vercel frontend, Google Apps Script backend, Google Sheets data store |
| UAT Completion | Pending MVP UAT sign-off |

## Evidence To Capture

- Screenshot of staging URL with HTTPS.
- Screenshot or export of Vercel security headers or `vercel.json`.
- Screenshot of Google OAuth allowed origins and redirect URI configuration.
- Screenshot of Apps Script deployment settings.
- Screenshot of restricted Google Sheets sharing permissions.
- Screenshot of login/account lockout behavior.
- Screenshot of role-based access differences.
- Screenshot of export purpose prompt and audit log entry.
- Screenshot of public dashboard showing aggregate-only data.
- Build output showing `npm run deploy:check` passes.
- QA execution screenshots for major workflows.
- VA remediation evidence after findings are issued.

