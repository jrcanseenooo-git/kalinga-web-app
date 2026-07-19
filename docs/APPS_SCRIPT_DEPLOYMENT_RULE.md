# Apps Script Deployment Rule

For every backend update to the Kalinga Apps Script project:

1. Update the existing Apps Script project and web app deployment only.
2. Do not create a new Apps Script deployment ID for normal backend updates.
3. Preserve the same web app deployment URL / deployment ID already used by the frontend.
4. Create a new Apps Script version for the update.
5. Rename the deployment description using this format:
   `Kalinga_deploy_v{version}`
6. Version numbers must increment from the latest active deployment. If the active deployment is `Kalinga_deploy_v40`, the next backend deployment must be `Kalinga_deploy_v41`.
7. Before pushing backend files, preserve production constants and secrets from the live Apps Script project, especially `SPREADSHEET_ID`.

Current known active deployment:

- Active deployment description: `Kalinga_deploy_v42`
- Existing deployment ID: `AKfycby8TMwYFpmfZoX0VXVi-YKUrCAv-caVlUcplonXQ1ho5_YsBC1YERlzLdTTlLr_hFXIqQ`
- Next required deployment description: `Kalinga_deploy_v43`
