import puppeteer from "puppeteer";

/**
 * Scrapes contact info (emails and phone numbers) from the given URL.
 * @param {string} url
 * @returns {Promise<{emails: string[], phoneNumbers: string[]}>}
 */
export async function scrapeContactInfo(url) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    console.log(`Navigating to ${url}...`);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.setViewport({ width: 1080, height: 1024 });

    // Select common contact info elements
    const contactElements = await page.$$(
      ".contact, .contact-info, .contact-details, main, footer"
    );

    let combinedText = "";

    // Extract text from selected elements
    for (const el of contactElements) {
      const text = await page.evaluate(el => el.textContent, el);
      combinedText += text + "\n";
    }

    // Fallback to whole page text if no contact-specific elements found
    if (!combinedText.trim()) {
      combinedText = await page.evaluate(() => document.body.innerText);
    }

    // Find emails
    const emails = combinedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];

    // Find raw phone numbers
    const phonesRaw = combinedText.match(/(\+?\d[\d\s().-]{7,})/g) || [];

    // Clean phone numbers
    const cleanedPhones = phonesRaw
      .map(num =>
        num
          .replace(/\s+/g, " ")
          .replace(/[^+\d\s().-]/g, "")
          .trim()
      )
      .filter(num => num.length >= 7);

    await browser.close();

    return {
      emails: [...new Set(emails)],
      phoneNumbers: [...new Set(cleanedPhones)],
    };
  } catch (err) {
    console.error("Error scraping:", err);
    if (browser) await browser.close();
    throw new Error("Scraping failed.");
  }
}

// Standalone execution support
if (process.argv.length > 2) {
  const url = process.argv[2];
  scrapeContactInfo(url)
    .then(result => {
      console.log("Scraping complete:");
      console.log("Emails:", result.emails);
      console.log("Phone numbers:", result.phoneNumbers);
    })
    .catch(err => {
      console.error("Failed to scrape:", err.message);
    });
} else {
  console.log("Usage: node scrapeContactInfo.js <url>");
}
