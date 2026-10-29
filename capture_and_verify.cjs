const puppeteer = require('d:/SIH265/web/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'docs', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  console.log('🚀 Starting headless browser verification with Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,900'
    ],
    defaultViewport: {
      width: 1440,
      height: 900
    }
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Landing Page
    console.log('📸 1. Capturing Landing Page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_landing_page.png'), fullPage: false });

    // 2. Login Page
    console.log('📸 2. Capturing Login Page & Demo Cards...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_login_page.png'), fullPage: false });

    // Click on "Scrutiny Officer" demo button
    console.log('🔑 Logging in as Scrutiny Officer (officer1)...');
    const officerBtn = await page.waitForSelector('button ::-p-text("Scrutiny Officer")', { timeout: 5000 })
      .catch(async () => {
        // Fallback search buttons containing officer
        const buttons = await page.$$('button');
        for (const b of buttons) {
          const text = await b.evaluate(el => el.textContent);
          if (text && text.includes('Scrutiny Officer')) return b;
        }
        return null;
      });

    if (officerBtn) {
      await officerBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    } else {
      console.log('⚠️ Could not find Scrutiny Officer button directly, filling credentials');
      await page.type('input[placeholder*="username" i], input[type="text"]', 'officer1');
      await page.type('input[placeholder*="password" i], input[type="password"]', 'Demo@123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    }

    // Check if we are on 2FA page
    if (page.url().includes('login') || (await page.$('input[placeholder*="123456" i], input[maxLength="6"], input[type="text"]'))) {
      const otpInput = await page.$('input[placeholder*="123456" i], input[maxLength="6"]');
      if (otpInput) {
        console.log('🔢 Submitting 2FA OTP 123456...');
        await otpInput.type('123456');
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
      }
    }

    await page.waitForTimeout ? page.waitForTimeout(1500) : new Promise(r => setTimeout(r, 1500));

    // 3. Dashboard
    console.log('📸 3. Capturing Dashboard (Officer View)...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_dashboard.png'), fullPage: false });

    // 4. FDR Repository
    console.log('📸 4. Capturing FDR Repository Table...');
    await page.goto('http://localhost:5173/fdrs', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_fdr_repository.png'), fullPage: false });

    // 5. FDR Detail Page (Use FDR-HDFC-9921 with discrepancy)
    console.log('📸 5. Capturing FDR Detail Page for FDR-HDFC-9921...');
    await page.goto('http://localhost:5173/fdrs/cmvu1jx9k000tznz7vzc6f3wo', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_fdr_detail.png'), fullPage: false });

    // 5b. Verification Tab
    const tabs = await page.$$('button');
    for (const t of tabs) {
      const text = await t.evaluate(el => el.textContent);
      if (text && text.includes('Verification')) {
        await t.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05b_fdr_verification_tab.png'), fullPage: false });

    // 6. FDR Submission Page (switch to institution1)
    console.log('📸 6. Capturing FDR Submission Wizard...');
    // Log out or switch to institution user
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 });
    const instBtn = await page.waitForSelector('button ::-p-text("Institution User")', { timeout: 5000 })
      .catch(async () => {
        const buttons = await page.$$('button');
        for (const b of buttons) {
          const text = await b.evaluate(el => el.textContent);
          if (text && text.includes('Institution')) return b;
        }
        return null;
      });

    if (instBtn) {
      await instBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
    }
    await page.goto('http://localhost:5173/fdrs/new', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_fdr_submission.png'), fullPage: false });

    // 7. Release Workflow Page
    console.log('📸 7. Capturing Release Workflow...');
    await page.goto('http://localhost:5173/release', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_release_workflow.png'), fullPage: false });

    // 8. Audit Trail Page (as Admin)
    console.log('📸 8. Capturing Cryptographic Audit Trail...');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 });
    const adminBtn = await page.waitForSelector('button ::-p-text("System Admin")', { timeout: 5000 })
      .catch(async () => {
        const buttons = await page.$$('button');
        for (const b of buttons) {
          const text = await b.evaluate(el => el.textContent);
          if (text && text.includes('Admin')) return b;
        }
        return null;
      });
    if (adminBtn) {
      await adminBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
    }
    await page.goto('http://localhost:5173/audit', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_audit_trail.png'), fullPage: false });

    // 9. Integrations Hub
    console.log('📸 9. Capturing Integrations Hub...');
    await page.goto('http://localhost:5173/integrations', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_integrations_hub.png'), fullPage: false });

    // 10. Demo Guide Drawer
    console.log('📸 10. Capturing Demo Guide Drawer...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    // Click the Demo Guide button
    const guideBtn = await page.$('button[title*="Demo Guide" i], button ::-p-text("Demo Guide")');
    if (guideBtn) {
      await guideBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    } else {
      // Find button with text Demo Guide
      const buttons = await page.$$('button');
      for (const b of buttons) {
        const text = await b.evaluate(el => el.textContent);
        if (text && text.includes('Demo Guide')) {
          await b.click();
          await new Promise(r => setTimeout(r, 1000));
          break;
        }
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_demo_guide_drawer.png'), fullPage: false });

    console.log('✅ All 10 screenshots captured successfully in docs/screenshots/!');
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors noted during run:');
      consoleErrors.slice(0, 5).forEach(e => console.log('  -', e));
    } else {
      console.log('🎉 Zero console errors detected during verification!');
    }

  } catch (err) {
    console.error('❌ Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
