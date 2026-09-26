import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base=process.env.YUI_URL || 'http://127.0.0.1:5173/outputs/yui-detail-repair/';
const out=new URL('repair-review/',import.meta.url);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1320,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const report={date:new Date().toISOString(),url:base,checks:{},errors};
const shot=name=>page.screenshot({path:fileURLToPath(new URL(name+'.png',out))});
try {
  await page.goto(base+'repair-review/');
  await page.waitForFunction(()=>window.yuiReview?.ready);
  await page.waitForTimeout(500);
  const difference=await page.evaluate(()=>{
    const canvases=['before','after'].map(id=>document.getElementById(id));
    const pixels=canvases.map(c=>{const scratch=document.createElement('canvas');scratch.width=c.width;scratch.height=c.height;const ctx=scratch.getContext('2d');ctx.drawImage(c,0,0);return ctx.getImageData(0,0,c.width,c.height).data});
    const width=canvases[0].width,height=canvases[0].height;let changed=0,x0=width,y0=height,x1=0,y1=0;
    for(let i=0;i<pixels[0].length;i+=4){if(Math.max(...[0,1,2].map(k=>Math.abs(pixels[0][i+k]-pixels[1][i+k])))>2){changed++;let x=(i/4)%width,y=Math.floor(i/4/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}}
    return {width,height,changed,box:[x0,y0,x1,y1],equalCanvasSize:width===canvases[1].width&&height===canvases[1].height};
  });
  report.checks.actualRenderedChange=difference;
  await shot('face-comparison');
  assert(difference.equalCanvasSize);
  assert(difference.changed>0&&difference.changed<difference.width*difference.height*.002,'Colour repair changed more than the local nose pixels');
  assert(difference.box[2]-difference.box[0]<difference.width*.1&&difference.box[3]-difference.box[1]<difference.height*.1);
  report.checks.actualRenderedChange=difference;
  await shot('face-comparison');
  for(const [angle,name] of [['45','quarter-comparison'],['90','left-comparison'],['-90','right-comparison']]){
    await page.locator(`[data-angle="${angle}"]`).click();await page.waitForTimeout(200);await shot(name);
  }
  await page.locator('[data-angle="0"]').click();await page.locator('#size').click();await page.waitForTimeout(200);await shot('front-comparison');
  await page.locator('#motion').click();await page.waitForTimeout(400);await shot('run-front-comparison');
  await page.locator('[data-angle="90"]').click();await page.waitForTimeout(300);await shot('run-side-comparison');
  report.checks.sameAssetComparison=await page.evaluate(()=>window.yuiReview.states());
  await page.goto(base+'dist/');await page.waitForFunction(()=>window.sakura?.getState().model.ready);
  await page.locator('#inspect').click();await page.waitForTimeout(1100);await shot('game-full');
  await page.locator('#view-close').click();await page.waitForTimeout(1100);await shot('game-face');
  await page.locator('#view-side').click();assert.equal(await page.evaluate(()=>sakura.getState().orbit),Math.PI/2);
  await page.locator('#view-other-side').click();assert.equal(await page.evaluate(()=>sakura.getState().orbit),-Math.PI/2);
  await page.locator('#view-front').click();
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1100);await shot('mobile-face');
  const bounds=await page.evaluate(()=>({controls:document.getElementById('character-controls').getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('#character-controls button')].map(b=>b.getBoundingClientRect().toJSON()),scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert(bounds.scroll<=bounds.width,'Mobile controls cause horizontal overflow');
  for(const b of bounds.buttons){assert(b.left>=0&&b.right<=390&&b.top>=0&&b.bottom<=844,'Control outside mobile viewport')}
  report.checks.mobileControls=bounds;
  await page.locator('#view-close').click();await page.waitForTimeout(1100);await shot('mobile-full');
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(1100);await shot('landscape-full');
  const landscape=await page.evaluate(()=>document.getElementById('character-controls').getBoundingClientRect().toJSON());
  assert(landscape.left>500&&landscape.bottom<=390&&landscape.top>=76,'Landscape controls overlap reserved model area');
  report.checks.landscapeControls=landscape;
  await page.setViewportSize({width:390,height:844});
  await page.locator('#view-exit').click();await page.locator('#start').click();
  await page.evaluate(()=>{sakura.move(1);sakura.jump()});
  await page.waitForFunction(()=>sakura.getState().y>.1);
  const jumping=await page.evaluate(()=>sakura.getState());assert.equal(jumping.lane,1);assert.equal(jumping.model.animation,'Jump');await shot('game-jump');
  await page.evaluate(()=>sakura.pause());assert.equal(await page.evaluate(()=>sakura.getState().state),'paused');
  await page.evaluate(()=>sakura.pause());assert.equal(await page.evaluate(()=>sakura.getState().state),'running');
  report.checks.jumpLanePauseResume=true;report.checks.musicPlaying=jumping.music.playing;
  assert(jumping.music.playing,'Background track failed to start after click');
  await page.goto(base+'dist/?detail=published');await page.waitForFunction(()=>window.sakura?.getState().model.ready);
  assert.equal(await page.evaluate(()=>sakura.getState().model.faceDetail),'published');report.checks.repairOffSwitch=true;
  assert.equal(errors.length,0,JSON.stringify(errors));
  // An intentionally unavailable optional layer must still allow the intact base to run.
  const fallback=await browser.newPage();
  await fallback.route('**/yui-eye-detail.glb*',route=>route.abort());
  await fallback.goto(base+'dist/');await fallback.waitForFunction(()=>window.sakura?.getState().model.ready);
  await fallback.locator('#start').click();
  const fallbackState=await fallback.evaluate(()=>sakura.getState());
  assert.equal(fallbackState.state,'running');assert.equal(fallbackState.model.eyeDetail,'original (optional detail unavailable)');
  report.checks.optionalDetailFailureFallback={state:fallbackState.state,eyeDetail:fallbackState.model.eyeDetail};await fallback.close();
  report.passed=true;
} finally {
  await fs.writeFile(new URL('browser-validation.json',out),JSON.stringify(report,null,2));
  await browser.close();
}
console.log(JSON.stringify(report,null,2));
