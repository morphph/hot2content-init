const puppeteer = require('puppeteer');

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  console.log('Taking homepage screenshot...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/tmp/hot2content-home.png' });
  
  console.log('Taking English blog screenshot...');
  await page.goto('http://localhost:3000/en/blog', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/tmp/hot2content-en-blog.png' });
  
  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
