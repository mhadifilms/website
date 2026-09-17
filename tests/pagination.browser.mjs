/* global document, innerWidth */
import {chromium,expect} from '@playwright/test'
const base=process.env.PAGINATION_TEST_URL || 'http://127.0.0.1:5201'
const browser=await chromium.launch({channel:'chrome',headless:true})
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'})
  const page=await context.newPage()
  for(const kind of ['writing','folder']) {
   await page.goto(base+(kind==='writing'?'/writing/':'/archives/writings/'))
   const root=page.locator(kind==='writing'?'.native-writing-index':'.archive-library')
   const rows=root.locator(kind==='writing'?'.native-writing-row':'.archive-library-entry')
   const top=root.getByRole('navigation',{name:'Pages (top)'})
   const bottom=root.getByRole('navigation',{name:'Pages (bottom)'})
   await expect(rows).toHaveCount(6)
   await expect(top.getByRole('button',{name:'Previous'})).toBeDisabled()
   const first=await rows.first().getAttribute('href')
   await bottom.getByRole('button',{name:'Next'}).click()
   await expect(top.getByRole('combobox')).toHaveValue('2')
   await expect(rows.first()).not.toHaveAttribute('href',first)
   await expect.poll(()=>root.locator('.collection-page-start').evaluate(el=>Math.abs(el.getBoundingClientRect().top-32))).toBeLessThan(5)
   await expect(root.locator('.collection-page-start')).toBeFocused()
   const secondPageFirst=await rows.first().getAttribute('href')
   await rows.first().click();await expect(page.locator('.native-post h1')).toBeVisible()
   await page.goBack();await expect(top.getByRole('combobox')).toHaveValue('2')
   await expect(rows.first()).toHaveAttribute('href',secondPageFirst)
   if(kind==='writing') {
    await rows.first().click();await page.locator('.native-writing-page > nav').getByRole('link',{name:'Writing',exact:true}).click()
    await expect(top.getByRole('combobox')).toHaveValue('2')
   }
   await top.getByRole('combobox').selectOption('6')
   await expect(rows).toHaveCount(kind==='writing'?2:3)
   await expect(top.getByRole('button',{name:'Next'})).toBeDisabled()
   await page.reload();await expect(top.getByRole('combobox')).toHaveValue('6')
   const input=root.locator('input').first();await input.fill('master of my prompt')
   await expect(rows).toHaveCount(1);await expect(top).toHaveCount(0)
   await input.fill('');await expect(rows).toHaveCount(6);await expect(top.getByRole('combobox')).toHaveValue('1')
   if(kind==='folder') {
    await top.getByRole('button',{name:'Next'}).click()
    await root.getByRole('combobox',{name:'Sort by'}).selectOption('oldest')
    await expect(top.getByRole('combobox')).toHaveValue('1')
   }
   await top.scrollIntoViewIfNeeded();await page.screenshot({path:`/private/tmp/pagination-${kind}-${width}.png`})
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  }
  await page.goto(base+'/writing/?page=999');await expect(page.getByRole('navigation',{name:'Pages (top)'}).getByRole('combobox')).toHaveValue('6')
  await context.close();console.log(`${width}px: six-item pages, jump/next/previous, last page, reload, article return, search reset and overflow passed`)
 }
} finally {await browser.close()}
