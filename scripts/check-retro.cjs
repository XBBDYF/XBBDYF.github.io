// Run after node scripts/build-retro.cjs. Checks only the independent classic edition.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,'');
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${dir}/${entry.name}`):entry.name.endsWith('.html')?[`${dir}/${entry.name}`]:[]);
const files=walk('retro');
let references=0;
for(const file of files){
 const html=read(file);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${file}: one site heading`);
 assert.ok(!/<script[^>]*src="https?:|<link[^>]*href="https?:|cdnjs|marked\.min\.js|highlight\.min\.js/.test(html),`${file}: no external rendering dependencies`);
 assert.ok(html.includes('aria-label="主导航"'),`${file}: navigation label`);
 for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(?:https?:|mailto:|data:|tel:)/.test(url))continue;
  const [urlPath,fragment]=url.split('#');
  let target=path.resolve(root,path.dirname(file),decodeURIComponent(urlPath.split('?')[0]||path.basename(file)));
  assert.ok(target.startsWith(root+path.sep),`${file}: reference escapes repository ${url}`);
  assert.ok(fs.existsSync(target),`${file}: missing ${url}`);
  if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  if(fragment)assert.ok(fs.readFileSync(target,'utf8').includes(`id="${fragment}"`),`${file}: missing anchor ${url}`);
  references++;
 }
 for(const [,attrs] of html.matchAll(/<img\b([^>]+)>/g)){
  assert.ok(/width="\d+"/.test(attrs)&&/height="\d+"/.test(attrs),`${file}: image dimensions`);
  assert.ok(/loading="lazy"/.test(attrs),`${file}: lazy images`);
 }
 assert.ok(!/<audio[^>]+src=/.test(html),`${file}: audio must be opt-in`);
 for(const [,attrs] of html.matchAll(/<video\b([^>]+)>/g))assert.ok(/preload="none"/.test(attrs),`${file}: video must be opt-in`);
 for(const asset of ['retro.css','retro.js']){
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'retro',asset))).digest('hex').slice(0,10);
  assert.ok(html.includes(`${asset}?v=${hash}`),`${file}: stale ${asset} cache version`);
 }
}
const articleCount=JSON.parse(read('articles/list.json')).length;
assert.equal((read('retro/index.html').match(/class="post-row"/g)||[]).length,articleCount,'All article rows are statically generated');
assert.ok(read('retro/posts/5.html').includes('-body.webp'),'Chinese JPEG uses optimized image');
assert.ok(read('retro/retro.css').includes('[hidden]'),'Hidden state respected by CSS');
assert.ok(!/fetch\(/.test(read('retro/retro.js')),'No search API or dynamic article download');
const feed=read('retro/feed.xml');
assert.equal((feed.match(/<item>/g)||[]).length,articleCount,'Retro RSS includes all articles');
assert.ok(!/<link>(?!https?:)/.test(feed),'Retro RSS uses absolute links');
assert.ok(feed.includes('/retro/posts/2.html'),'Retro RSS links to classic article pages');
console.log(`PASS: ${files.length} retro pages, ${references} local references, article content, image dimensions, opt-in media, RSS, cache versions.`);
