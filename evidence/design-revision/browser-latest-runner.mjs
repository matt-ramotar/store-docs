// Invoked through the authorized browser runtime; all page reads are DOM-backed.
export async function captureRoute(tab) {
  return tab.playwright.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[id]')).map(e => e.id);
    const seen = new Set();
    const visible = e => {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const landmarks = Array.from(document.querySelectorAll('main,[role="main"]')).map(e => ({tag:e.tagName,id:e.id,role:e.getAttribute('role')}));
    return {
      path:location.pathname,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,title:document.title,
      h1:Array.from(document.querySelectorAll('h1')).map(e=>e.innerText),main:landmarks.length,landmarks,
      duplicates:ids.filter(id=>seen.has(id)||!seen.add(id)),
      hashLinks:Array.from(document.querySelectorAll('a[href^="#"]')).map(e=>({href:e.getAttribute('href'),target:!!document.getElementById(e.getAttribute('href').slice(1))})),
      controls:Array.from(document.querySelectorAll('button,summary,[role="tab"],select,input')).filter(visible).map(e=>{
        const r=e.getBoundingClientRect();
        return {tag:e.tagName,role:e.getAttribute('role'),name:e.getAttribute('aria-label')||e.innerText||e.getAttribute('placeholder')||e.getAttribute('title'),disabled:e.disabled||e.getAttribute('aria-disabled')==='true',left:r.left,right:r.right,width:r.width,height:r.height,tabIndex:e.tabIndex};
      }),
      copy:Array.from(document.querySelectorAll('button[aria-label="Copy code"]')).map((b,index)=>{
        const block=b.closest('.store-m-code'),raw=block?.querySelector('[data-raw-code]');
        return {index,visible:visible(b),kind:raw?'compiled-fence':'code-slab',expected:raw?.getAttribute('data-raw-code')??block?.querySelector('pre code')?.textContent??null};
      }),
      images:Array.from(document.images).filter(visible).map(e=>({src:e.getAttribute('src'),complete:e.complete,width:e.naturalWidth})),
    };
  });
}

export async function runBatch(ctx, start, end, width) {
  const {tab,viewport,paths,records,copies,colors,exclusions,fs,root,build,captureColors}=ctx;
  await viewport.set({width,height:900});
  for(const path of paths.slice(start,end)) {
    await tab.goto('http://127.0.0.1:3222'+path);
    await tab.playwright.locator('h1').nth(0).waitFor({state:'visible'});
    const r=await captureRoute(tab);
    records.push(r);
    for(const c of r.copy.filter(c=>c.visible)) {
      await tab.playwright.locator('button[aria-label="Copy code"]').nth(c.index).press('Enter');
      await tab.playwright.locator('button[aria-label="Copy code"] + [aria-live="polite"]').nth(c.index).filter({hasText:'Code copied.'}).waitFor({state:'attached'});
      const actual=await tab.clipboard.readText();
      copies.push({path,width,index:c.index,kind:c.kind,expectedLength:c.expected?.length,actualLength:actual.length,exact:actual===c.expected,announcement:'Code copied.',focus:await tab.playwright.evaluate(()=>({label:document.activeElement?.getAttribute('aria-label'),focusVisible:document.activeElement?.matches(':focus-visible')}))});
    }
    if(width===1440&&!path.startsWith('/reference/')) {
      const captured=await captureColors(tab,path+' '+width,'main,[role="main"]');
      const unique=new Map();
      for(const sample of captured.samples) {
        if(sample.layers.some(l=>Number(l.opacity)===0)) {
          exclusions.push({id:sample.id,fixture:sample.fixture,label:sample.label,reason:'Unpainted opacity-zero rest state'});
          continue;
        }
        const key=JSON.stringify([sample.foreground,sample.fontSize,sample.fontWeight,sample.layers,sample.inactive]);
        if(!unique.has(key)) unique.set(key,{...sample,occurrences:1});
        else unique.get(key).occurrences++;
      }
      colors.push(...unique.values());
    }
  }
  const prefix = ctx.prefix ?? 'resume-final';
  await fs.writeFile(root+'/browser/'+prefix+'-routes.json',JSON.stringify({buildId:build,records},null,2));
  await fs.writeFile(root+'/browser/'+prefix+'-copy.json',JSON.stringify({buildId:build,records:copies},null,2));
  return {routes:records.length,copies:copies.length,layoutFailures:records.filter(r=>r.width!==r.scrollWidth||r.main!==1||r.h1.length!==1||r.duplicates.length||r.hashLinks.some(h=>!h.target)).map(r=>({path:r.path,width:r.width,main:r.main})),copyFailures:copies.filter(r=>!r.exact)};
}
