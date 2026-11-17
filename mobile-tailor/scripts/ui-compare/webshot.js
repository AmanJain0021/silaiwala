// Screenshots of the live web app at phone width (the UI spec for the native app).
// usage: node webshot.js <outdir> <path1> [path2...]
// Logged-in pages: set LOGIN_PHONE and LOGIN_PASS in the environment for the run (never write them to a file).
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const BASE = process.env.WEB_BASE || 'https://sewzella.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const [outdir, ...paths] = process.argv.slice(2);
  fs.mkdirSync(outdir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--lang=en-IN'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 15; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0 Mobile Safari/537.36');

  if (process.env.LOGIN_PHONE) {
    await page.goto(`${BASE}/user/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    const tel = await page.$('input[type="tel"], input[name="phone"], input[placeholder*="mobile" i]');
    await tel.click({ clickCount: 3 });
    await tel.type(process.env.LOGIN_PHONE);
    await (await page.$('input[type="password"]')).type(process.env.LOGIN_PASS);
    for (const b of await page.$$('button')) {
      const t = (await (await b.getProperty('innerText')).jsonValue()).trim();
      if (/^sign in$/i.test(t)) { await b.click(); break; }
    }
    await sleep(5000);
    console.log('after login:', page.url());
  }

  for (const p of paths) {
    try { await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 60000 }); } catch { console.log('timeout', p); }
    await sleep(2500);
    const name = p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root';
    await page.screenshot({ path: `${outdir}/${name}.png` });
  }
  await browser.close();
  console.log('web shots:', paths.length);
})().catch((e) => { console.error(e); process.exit(1); });
