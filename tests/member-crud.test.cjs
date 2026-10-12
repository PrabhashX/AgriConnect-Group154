
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const evidence=path.join(root,'evidence');
const shots=path.join(evidence,'crud-screenshots');fs.mkdirSync(shots,{recursive:true});
let browser,page,orderId;const results=[],errors=[];
async function login(role){await page.locator(`[data-action="demo"][data-id="${role}"]`).click();await page.locator('.nav').waitFor();}
async function logout(){await page.locator('header [data-action="profile"]').click();await page.locator('[data-action="logout"]').click();}
async function nav(id){await page.locator(`[data-action="nav"][data-id="${id}"]`).click();}
async function shot(id){await page.evaluate(()=>{window.scrollTo(0,0);document.getElementById('toast').classList.remove('show');});await page.screenshot({path:path.join(shots,id+'.png'),animations:'disabled'});}
async function check(id,member,area,operations,fn){
 const start=Date.now();
 try{await fn();results.push({id,member,interface:area,operations,status:'PASS',durationMs:Date.now()-start});console.log(id+' PASS '+area+' ['+operations.join('/')+']');}
 catch(error){results.push({id,member,interface:area,operations,status:'FAIL',error:error.message});throw error;}
}
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.APP_URL||'http://localhost:8765');await page.locator('#authForm').waitFor();await login('buyer');
 await check('MC01','DEWRANGA K K','Buyer catalogue, detail and comparison',['Read','Create saved association','Delete saved association'],async()=>{
  assert.equal(await page.locator('.product').count(),6);
  const fav=()=>page.locator('.product [data-action="favorite"][data-id="p1"]');
  await fav().click();assert.equal(await fav().getAttribute('aria-pressed'),'true');
  await page.locator('[data-action="saved"]').click();assert.equal(await page.locator('.product').count(),1);
  await fav().click();assert.equal(await page.locator('.product').count(),0);
  await page.locator('[data-action="saved"]').click();
  for(const id of ['p1','p6']){await page.locator(`[data-action="product"][data-id="${id}"]`).click();assert.ok((await page.locator('h1').textContent()).length);await page.locator('[data-action="toggleCompare"]').click();await page.locator('[data-action="back"]').click();}
  await page.locator('[data-action="compare"]').click();assert.equal(await page.locator('.compare-table tbody tr').count(),2);
  const save=()=>page.locator('[data-action="favorite"][data-id="p1"]');
  await save().click();assert.match(await save().textContent(),/Remove saved/);await shot('MC01-comparison-saved');
  await save().click();assert.match(await save().textContent(),/Save product/);
 });
 await check('MC02','DEWRANGA K K','Buyer basket, checkout and order instructions',['Create','Read','Update','Delete basket line'],async()=>{
  await nav('home');await page.locator('[data-action="quickAdd"][data-id="p1"]').click();await nav('cart');
  assert.equal(await page.locator('[data-cart="p1"]').inputValue(),'1');
  await page.locator('[data-cart="p1"]').fill('2');await page.locator('[data-cart="p1"]').dispatchEvent('change');
  assert.match(await page.locator('.total-line.final').textContent(),/990/);
  await page.locator('[data-action="removeCart"]').click();assert.match(await page.locator('main').textContent(),/Your basket is waiting/);
  await nav('home');await page.locator('[data-action="quickAdd"][data-id="p1"]').click();await nav('cart');
  await page.locator('[data-cart="p1"]').fill('2');await page.locator('[data-cart="p1"]').dispatchEvent('change');
  await page.locator('[data-action="checkout"]').click();assert.match(await page.locator('.total-line.final').textContent(),/990/);
  await page.locator('[name="address"]').fill('32/A, Flower Road, Colombo 07');await page.locator('#checkoutForm button[type="submit"]').click();
  orderId=(await page.locator('header strong').textContent()).match(/AC\d+/)[0];
  await page.locator('#noteForm [name="note"]').fill('Updated instructions: use the side gate.');await page.locator('#noteForm button').click();
  assert.match(await page.locator('.address').last().textContent(),/Updated instructions/);await shot('MC02-buyer-order-update');
  // Also verify Update directly on the order-list interface, without deleting its record.
  await nav('home');await page.locator('[data-action="quickAdd"][data-id="p6"]').click();await nav('cart');await page.locator('[data-action="checkout"]').click();await page.locator('#checkoutForm button[type="submit"]').click();
  const cancelId=(await page.locator('header strong').textContent()).match(/AC\d+/)[0];await nav('orders');
  await page.locator(`[data-action="cancelOrder"][data-id="${cancelId}"]`).click();await page.locator('[data-confirm="yes"]').click();
  assert.match(await page.locator('.order-card').filter({hasText:cancelId}).textContent(),/Cancelled/);
 });
 await logout();await login('farmer');
 await check('MC03','PRABHASHWARA S N','Farmer listings and create/edit form',['Create','Read','Update','Delete'],async()=>{
  await page.locator('[data-action="newProduct"]').click();await page.locator('[name="name"]').fill('CRUD audit pumpkin');await page.locator('[name="price"]').fill('250');await page.locator('[name="stock"]').fill('12');await page.locator('[name="district"]').fill('Matale');await page.locator('#productForm .btn').click();
  const card=()=>page.locator('main .card').filter({hasText:'CRUD audit pumpkin'});assert.equal(await card().count(),1);
  await card().locator('[data-action="editProduct"]').click();assert.equal(await page.locator('[name="price"]').inputValue(),'250');await page.locator('[name="price"]').fill('275');await page.locator('#productForm .btn').click();assert.match(await card().textContent(),/275/);await shot('MC03-farmer-listing-update');
  await card().locator('[data-action="deleteProduct"]').click();await page.locator('[data-confirm="yes"]').click();assert.equal(await card().count(),0);
 });
 await check('MC04','PRABHASHWARA S N','Farmer order list and fulfilment detail',['Read','Update'],async()=>{
  await nav('orders');const card=()=>page.locator('.order-card').filter({hasText:orderId});assert.match(await card().textContent(),/Vine tomatoes/);
  await card().locator('[data-action="order"]').click();assert.match(await page.locator('.address').last().textContent(),/side gate/);
  await nav('orders');await card().locator('[data-action="advance"]').click();assert.match(await card().textContent(),/Ready for pickup/);await shot('MC04-farmer-order-list-update');
 });
 await logout();await login('rider');
 await check('MC05','PERERA P A L R','Rider available jobs and pickup details',['Read','Update assignment'],async()=>{
  assert.equal(await page.locator('[data-action="advance"]').count(),1);
  await page.locator('[data-action="order"][data-id="'+orderId+'"]').click();assert.match(await page.locator('.address').last().textContent(),/Flower Road/);
  await nav('jobs');await page.locator('[data-action="advance"][data-id="'+orderId+'"]').click();
  assert.match(await page.locator('.order-card').filter({hasText:orderId}).textContent(),/Assigned/);await shot('MC05-rider-assignment');
 });
 await check('MC06','PERERA P A L R','Rider assigned delivery list and progress',['Read','Update'],async()=>{
  const card=()=>page.locator('.order-card').filter({hasText:orderId});
  await card().locator('[data-action="advance"]').click();assert.match(await card().textContent(),/Picked up/);
  await card().locator('[data-action="order"]').click();assert.match(await page.locator('.badge').first().textContent(),/Picked up/);
  await page.locator('[data-action="advance"]').click();assert.match(await page.locator('.badge').first().textContent(),/Out for delivery/);
  await nav('jobs');await card().locator('[data-action="advance"]').click();await page.locator('[data-confirm="yes"]').click();
  assert.match(await card().textContent(),/Delivered/);assert.match(await card().textContent(),/Collected/);await shot('MC06-rider-delivery-update');
 });
 await check('MC07','SEYON S','Shared account profile',['Read','Update'],async()=>{
  await page.locator('header [data-action="profile"]').click();assert.equal(await page.locator('[name="email"]').count(),0);
  await page.locator('[name="name"]').fill('Nuwan Silva CRUD audit');await page.locator('[name="phone"]').fill('0771234567');await page.locator('[name="address"]').fill('12, Lake Road, Colombo');await page.locator('#profileForm .btn').click();assert.match(await page.locator('h1').textContent(),/CRUD audit/);
  await page.reload();await page.locator('#authForm').waitFor();await login('rider');await page.locator('header [data-action="profile"]').click();assert.equal(await page.locator('[name="phone"]').inputValue(),'0771234567');assert.equal(await page.locator('[name="address"]').inputValue(),'12, Lake Road, Colombo');await shot('MC07-profile-persistence');
 });
 await check('MC08','SEYON S','Shared support requests and form',['Create','Read','Update','Delete'],async()=>{
  await nav('support');await page.locator('[data-action="newTicket"]').click();await page.locator('[name="subject"]').fill('Pickup location question');await page.locator('[name="message"]').fill('Please clarify the pickup location before my delivery.');await page.locator('#ticketForm .btn').click();assert.equal(await page.locator('[data-action="editTicket"]').count(),1);
  await page.locator('[data-action="editTicket"]').click();assert.equal(await page.locator('[name="subject"]').inputValue(),'Pickup location question');await page.locator('[name="subject"]').fill('Updated pickup question');await page.locator('#ticketForm .btn').click();assert.match(await page.locator('main').textContent(),/Updated pickup question/);await shot('MC08-support-update');
  await page.locator('[data-action="deleteTicket"]').click();await page.locator('[data-confirm="yes"]').click();assert.equal(await page.locator('[data-action="editTicket"]').count(),0);
 });
 await logout();await login('farmer');
 await check('MC09','PRABHASHWARA S N','Additional farmer verification request',['Create','Read','Update','Delete'],async()=>{
  await page.locator('header [data-action="profile"]').click();await page.locator('[data-action="verification"]').click();await page.locator('[name="farm"]').fill('Audit Farm');await page.locator('[name="district"]').fill('Matale');await page.locator('#verificationForm .btn').click();assert.match(await page.locator('.badge').textContent(),/Pending review/);
  await page.locator('[name="farm"]').fill('Audit Farm revised');await page.locator('[name="district"]').fill('Kandy');await page.locator('#verificationForm .btn').click();assert.equal(await page.locator('[name="district"]').inputValue(),'Kandy');await shot('MC09-verification-update');
  await page.locator('[data-action="withdrawVerification"]').click();assert.match(await page.locator('.badge').textContent(),/Not submitted/);
 });
 await logout();await login('buyer');
 await check('MC10','DEWRANGA K K','Additional delivered-order review',['Create','Read','Update','Delete'],async()=>{
  await nav('orders');await page.locator('[data-action="order"][data-id="'+orderId+'"]').click();
  await page.locator('#reviewForm [name="text"]').fill('Fresh produce with clear delivery updates.');await page.locator('#reviewForm .btn').click();assert.equal(await page.locator('[data-action="deleteReview"]').count(),1);
  await page.locator('#reviewForm [name="rating"]').selectOption('4');await page.locator('#reviewForm [name="text"]').fill('Updated review after inspecting the produce.');await page.locator('#reviewForm .btn').click();assert.equal(await page.locator('#reviewForm [name="rating"]').inputValue(),'4');assert.match(await page.locator('#reviewForm [name="text"]').inputValue(),/Updated review/);await shot('MC10-review-update');
  await page.locator('[data-action="deleteReview"]').click();await page.locator('[data-confirm="yes"]').click();assert.equal(await page.locator('[data-action="deleteReview"]').count(),0);assert.equal(await page.locator('#reviewForm [name="text"]').inputValue(),'');
  for(const width of [320,390,430]){await page.setViewportSize({width,height:844});await nav('orders');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await nav('home');await page.locator('[data-action="compare"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  assert.deepEqual(errors,[]);
 });
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
 fs.writeFileSync(path.join(evidence,'member-crud-results.json'),JSON.stringify({executedAt:new Date().toISOString(),environment:'Automated mobile Chrome execution of packaged UI; native phone runtime and human authorship not verified',results,scriptErrors:errors},null,2));
 if(browser)await browser.close();
});
