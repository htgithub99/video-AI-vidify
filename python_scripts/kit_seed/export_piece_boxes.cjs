const C = require("./kitSeedTexts.cjs");
const { chromium } = require("playwright");
let input = C.EMPTY;
process.stdin.setEncoding(C.UTF8);
process.stdin.on(C.DATA, (chunk) => (input += chunk));
process.stdin.on(C.END, async () => {
  let browser;
  try {
    browser = await chromium.launch(process.env.KIT_CHROMIUM ? { executablePath: process.env.KIT_CHROMIUM } : { channel: C.CHROME });
    const page = await browser.newPage();
    const boxes = [];
    for (const [defs, inner] of JSON.parse(input)) {
      await page.setContent(C.SVG(defs, inner));
      boxes.push(
        await page.locator(C.PIECE).evaluate((el) => {
          const b = el.getBBox();
          return [b.x, b.y, b.width, b.height];
        }),
      );
    }
    process.stdout.write(JSON.stringify(boxes));
  } catch (error) {
    process.stderr.write(String(error));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
});
