import { mkdir } from "node:fs/promises"
import { chromium } from "playwright"

const base = process.env.RENDER_BASE_URL ?? "http://127.0.0.1:3000"
const out = "/Users/zmaxx/Projects/Initia raid club/renders"

async function waitFor(page, ms) {
  await page.waitForTimeout(ms)
}

async function clickText(page, text) {
  await page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll("button"))
    const match = buttons.find((button) => button.textContent?.includes(label))

    if (!match) {
      throw new Error(`button not found: ${label}`)
    }

    match.click()
  }, text)
}

async function newPage(browser) {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1100 },
    colorScheme: "dark",
    deviceScaleFactor: 1,
  })

  await page.goto(base, { waitUntil: "domcontentloaded" })
  await waitFor(page, 2000)
  return page
}

async function capture() {
  await mkdir(out, { recursive: true })
  const browser = await chromium.launch({ headless: true })

  {
    const page = await newPage(browser)
    await page.screenshot({ path: `${out}/01-home.png`, fullPage: true })
    await page.close()
  }

  {
    const page = await newPage(browser)
    await clickText(page, "Raid Session")
    await waitFor(page, 400)
    await page.screenshot({ path: `${out}/02-raid-view.png`, fullPage: true })
    await page.close()
  }

  {
    const page = await newPage(browser)
    await clickText(page, "Inventory")
    await waitFor(page, 400)
    await page.screenshot({ path: `${out}/03-inventory-view.png`, fullPage: true })
    await page.close()
  }

  {
    const page = await newPage(browser)
    await clickText(page, "Leaderboard")
    await waitFor(page, 400)
    await page.screenshot({ path: `${out}/04-leaderboard-view.png`, fullPage: true })
    await page.close()
  }

  {
    const page = await newPage(browser)
    await clickText(page, "Activity")
    await waitFor(page, 400)
    await page.screenshot({ path: `${out}/05-activity-view.png`, fullPage: true })
    await page.close()
  }

  await browser.close()
}

await capture()
