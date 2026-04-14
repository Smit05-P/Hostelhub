const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 776 });
  
  try {
    console.log("Navigating to Visitor Management...");
    await page.goto('http://localhost:3000/admin/visitors', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\0a7095ab-1886-47f6-b823-7aa6872034cf\\visitor_dashboard_initial.png' });
    console.log("Captured initial dashboard");

    // Click "NEW CHECK-IN"
    console.log("Opening Check-in Form...");
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("NEW CHECK-IN")) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1000);
    
    console.log("Filling form...");
    // Find inputs
    const inputs = await page.$$('input[type="text"]');
    // Name
    await inputs[0].type('John Doe');
    // Phone
    await inputs[1].type('555-4444');
    
    // Search Student
    const searchInputs = await page.$$('input[placeholder="Search student name or ID..."]');
    if (searchInputs.length > 0) {
      await searchInputs[0].type('Alice');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\0a7095ab-1886-47f6-b823-7aa6872034cf\\visitor_student_picker.png' });
      console.log("Captured student picker");
      
      // Click Alice
      const userBtns = await page.$$('button');
      for (const btn of userBtns) {
        const span = await btn.$('span');
        const p = await btn.$('p');
        if (p) {
          const namePart = await page.evaluate(el => el.textContent, p);
          if (namePart && namePart.includes('Alice Johnson')) {
            await btn.click();
            break;
          }
        }
      }
    }
    await page.waitForTimeout(500);

    // Purpose
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('Meeting for project');
    }
    
    // Submit
    const authBtns = await page.$$('button');
    for (const btn of authBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("AUTHORIZE ENTRY")) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\0a7095ab-1886-47f6-b823-7aa6872034cf\\visitor_dashboard_after_entry.png' });
    console.log("Captured dashboard after entry");
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
