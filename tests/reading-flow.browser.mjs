/* global document, scrollY, scrollTo, navigator, innerWidth, getComputedStyle */
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.READING_TEST_URL || 'http://127.0.0.1:5197';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:900},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/writing/');await page.locator('.writing-featured').waitFor();
  await page.screenshot({path:`/private/tmp/reading-index-${width}.png`});
  const row=page.locator('.native-writing-row').nth(8);await row.scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>scrollY);await row.click();await page.locator('[data-reading-route] .native-post h1').waitFor();
  await page.waitForFunction(()=>scrollY<5);assert.equal(await page.locator('h1').evaluate(e=>e===document.activeElement),true);
  console.log({width,newArticleY:await page.evaluate(()=>scrollY),focusOnTitle:true});
  await page.goBack();await page.locator('.writing-featured').waitFor();await page.waitForFunction(y=>Math.abs(scrollY-y)<5,before);console.log({width,backRestored:before});
  await page.locator('input[aria-label="Search writing"]').fill('living in berkeley as a rejected student');await page.waitForURL(/q=living/);await expect(page.locator('.native-writing-row')).toHaveCount(1);assert(await page.locator('input[aria-label="Search writing"]').evaluate(e=>e===document.activeElement));
  await page.locator('.native-writing-row').click();await page.locator('.native-post h1').waitFor();await page.waitForFunction(()=>scrollY<5);
  await page.goBack();await page.locator('.native-writing-row').waitFor();assert.equal(await page.locator('input[aria-label="Search writing"]').inputValue(),'living in berkeley as a rejected student');
  await page.locator('input[aria-label="Search writing"]').fill('no-result-xyzabc');await page.locator('.writing-empty').waitFor();await page.getByRole('button',{name:'Clear search'}).click();await expect(page.locator('.native-writing-row')).toHaveCount(32);
  await page.goto(base+'/writing/the-power-of-the-sun-in-the-palm');await page.locator('.post-image-open').first().waitFor();await page.locator('.post-image-open').first().click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);assert(await page.locator('.post-image-open').first().evaluate(e=>e===document.activeElement));
  await page.evaluate(()=>scrollTo({top:1200,behavior:"instant"}));await page.locator('.reading-tools[data-started=true]').waitFor();await page.getByRole('button',{name:'Copy link to this post'}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),base+'/writing/the-power-of-the-sun-in-the-palm');
  await page.screenshot({path:`/private/tmp/reading-post-${width}.png`});
  await page.getByRole('button',{name:'Back to top',exact:true}).click();await page.waitForFunction(()=>scrollY<5);
  const next=page.locator('.post-related a').first();await next.click();await page.locator('.native-post h1').waitFor();await page.waitForFunction(()=>scrollY<5);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log({width,searchRetained:true,lightboxKeyboard:true,copyLink:true,relatedNavigationAtTop:true,noOverflow:true});
  await context.close();
 }
 const deep=await browser.newPage();
 await deep.route('**/publishing/manifest.json', async route => {await new Promise(resolve=>setTimeout(resolve,700));await route.continue();});
 await deep.goto(base+'/archives/writings/power-threes-storytelling#section-2');
 await deep.waitForFunction(()=>{const h=document.getElementById('section-2');return h&&Math.abs(h.getBoundingClientRect().top-90)<8});
 console.log({delayedDeepLink:true});await deep.close();
 const gallery=await browser.newPage({viewport:{width:390,height:850},hasTouch:true});
 await gallery.goto(base+'/archives/writings/we-made-movie-six-weeks');
 const images=gallery.locator('.post-gallery-grid').first().locator('a');await images.first().waitFor();await images.first().click();await gallery.locator('dialog[open]').waitFor();
 const initial=await gallery.locator('dialog[open] figure img').getAttribute('src');
 await gallery.getByRole('button',{name:'Next image',exact:true}).click();await expect(gallery.locator('dialog[open] figure img')).not.toHaveAttribute('src',initial);
 await gallery.locator('dialog[open]').dispatchEvent('touchstart',{touches:[{identifier:1,clientX:50,clientY:250}]});
 await gallery.locator('dialog[open]').dispatchEvent('touchend',{changedTouches:[{identifier:1,clientX:220,clientY:255}]});
 await expect(gallery.locator('dialog[open] figure img')).toHaveAttribute('src',initial);
 await gallery.keyboard.press('Escape');await expect(gallery.locator('dialog[open]')).toHaveCount(0);console.log({galleryButtonsAndSwipe:true});await gallery.close();
 const page=await browser.newPage({reducedMotion:'reduce'});await page.goto(base+'/writing/');await page.locator('.writing-featured').waitFor();assert.equal(await page.locator('.native-writing-page').evaluate(el=>getComputedStyle(el).animationName),'none');console.log({reducedMotion:true});
} finally {await browser.close()}
