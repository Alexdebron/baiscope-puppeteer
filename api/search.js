import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing ?q= parameter" });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(`https://baiscopes.lk/?s=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle2",
    });

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll(".post").forEach((el) => {
        const titleEl = el.querySelector("h2.entry-title a, h3.entry-title a");
        const imgEl = el.querySelector("img");
        const excerptEl = el.querySelector("p");

        if (titleEl) {
          items.push({
            title: titleEl.innerText.trim(),
            link: titleEl.href,
            img: imgEl ? imgEl.src : null,
            excerpt: excerptEl ? excerptEl.innerText.trim() : null,
          });
        }
      });
      return items;
    });

    res.json({
      query,
      count: results.length,
      creator: "Chamod Nimsara",
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, creator: "Chamod Nimsara" });
  } finally {
    if (browser) await browser.close();
  }
}
