const fs = require('fs/promises');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'screenshots');
const base = process.env.KALINGA_SCREENSHOT_BASE || 'http://127.0.0.1:5173';

const screenshots = [
  ['01-dashboard-demo.png', '/dashboard?demoScreenshots=1'],
  ['02-cases-list-demo.png', '/cases'],
  ['03-case-detail-demo.png', '/cases/CEFMU-202607-A1B2'],
  ['04-reports-demo.png', '/reports'],
  ['05-users-demo.png', '/users'],
  ['06-audit-logs-demo.png', '/audit-logs'],
];

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

  await page.goto(`${base}/dashboard?demoScreenshots=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  for (const [fileName, route] of screenshots) {
    await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(route.includes('dashboard') || route.includes('/cases/') ? 1800 : 900);

    if (route === '/reports') {
      const button = page.getByRole('button', { name: 'Generate report' });
      if (await button.count()) {
        await button.click();
        await page.waitForTimeout(700);
      }
    }

    const filePath = path.join(outDir, fileName);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(filePath);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
