# Deployment Request Memorandum Draft

**For:** ICTMS Director / Regional Director  
**Through:** [Name and Designation of endorsing official]  
**From:** Social Technology Bureau - Design Formulation Division  
**Subject:** Request for Deployment Review and Assistance for Project Kalinga - CEFMU Registry and Management System  
**Date:** [Insert date]

## 1. Purpose

This memorandum respectfully requests ICTMS technical review and deployment assistance for Project Kalinga - CEFMU Registry and Management System, a web-based information system for the recording, monitoring, validation, and reporting of Child, Early, and Forced Marriage and Union cases.

## 2. System Overview

Project Kalinga supports authorized DSWD personnel and partner users in conducting case intake, case assessment, service tracking, progress note documentation, referral tracking, case monitoring, reporting, user management, and audit review. The system also provides a public dashboard and FAQ containing aggregate and non-case-level information only.

The system uses the following deployment architecture:

- Frontend: Vue 3, Vite, Tailwind CSS, Pinia, and Vue Router hosted on Vercel over HTTPS.
- Backend/API: Google Apps Script web application.
- Data store: Google Sheets with restricted sharing permissions.
- Authentication: Google OAuth for DSWD personnel and email/password authentication for authorized external users.
- Security controls: role-based access, session management, account lockout, input sanitization, security headers, export purpose confirmation, and audit logging.

## 3. Deployment Request

The project team requests review and assistance for the following:

- Validation of deployment readiness.
- Software Quality Assurance review.
- Vulnerability Assessment coordination.
- Review of deployment compliance requirements.
- Guidance on production deployment, access modality, and preferred domain/API configuration.

## 4. Attached / Linked Documents

- Information System Documentation.
- User Manual.
- User Stories.
- SQA Test Plan.
- SQA Test Cases.
- SQA Compliance Checklist.
- SQA Test Report / Addressed QA Report, once completed.
- VA Security Compliance Checklist.
- Addressed Vulnerability Assessment Report, once completed.
- Deployment Compliance Checklist.
- UAT completion/sign-off, once completed.
- Data privacy/PIA memorandum or supporting privacy documentation, as required.

## 5. Current Status

The system is prepared for staging review, QA readiness, VA readiness, and deployment documentation completion. Production deployment should proceed only after QA findings, VA findings, UAT requirements, and data privacy requirements are addressed.

## 6. Requested Action

Approval is respectfully requested for ICTMS/RISO review and coordination of the remaining technical, quality assurance, vulnerability assessment, deployment compliance, and data privacy requirements for Project Kalinga.

Prepared by:

**[Name]**  
**[Designation]**  
Social Technology Bureau - Design Formulation Division

Reviewed/Endorsed by:

**[Name]**  
**[Designation]**

