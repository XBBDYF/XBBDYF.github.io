// Build-output checks: node scripts/check.cjs
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const files=['index.html',...JSON.parse(read('articles/list.json')).map(a=>`posts/${a.id}.html`)];
let references=0;
for(const file of files){
 const html=read(file);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${file}: one main heading`);
 assert.ok(!/cdnjs|<script[^>]+(?:marked|highlight|particles)/.test(html),`${file}: no runtime CDN or Markdown dependency`);
 for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(?:https?:|mailto:|data:|tel:)/.test(url))continue;
  const [pathname,fragment]=url.split('#');
  const target=path.resolve(root,path.dirname(file),decodeURIComponent(pathname.split('?')[0]||path.basename(file)));
  assert.ok(target===root||target.startsWith(root+path.sep),`Outside root: ${url}`);
  assert.ok(fs.existsSync(target),`${file}: missing ${url}`);
  if(fragment){
   let anchorTarget=target;
   if(fs.statSync(target).isDirectory())anchorTarget=path.join(target,'index.html');
   const contents=fs.readFileSync(anchorTarget,'utf8');
   assert.ok(contents.includes(`id="${fragment}"`),`${file}: missing anchor ${url}`);
  }
  references++;
 }
 for(const [,attrs] of html.matchAll(/<img\b([^>]+)>/g)){
  assert.ok(/\bwidth="\d+"/.test(attrs)&&/\bheight="\d+"/.test(attrs),`${file}: image dimensions`);
  assert.ok(/loading="lazy"/.test(attrs),`${file}: lazy image loading`);
 }
 for(const [,attrs] of html.matchAll(/<video\b([^>]+)>/g))assert.ok(/preload="none"/.test(attrs),`${file}: video downloads are opt-in`);
}
const homepage=read('index.html');
assert.equal((homepage.match(/class="post-card /g)||[]).length,files.length-1,'Static article cards exist without JS');
assert.ok(!/<audio[^>]+src=/.test(homepage),'Audio is not loaded until Play');
assert.ok(!read('assets/site.js').includes('fetch('),'Interactions require no API requests');
assert.ok(!/url\(https?:/.test(read('assets/site.css')),'No remote fonts or backgrounds');
assert.ok(read('posts/5.html').includes('-body.webp'),'Chinese-named article JPEG uses optimized WebP');
assert.ok(read('posts/5.html').includes('width="1400" height="884"'),'Chinese-named images have intrinsic dimensions');
const feed=read('feed.xml');
assert.equal((feed.match(/<item>/g)||[]).length,files.length-1,'RSS includes every article');
assert.ok(!/<link>(?!https?:)/.test(feed),'RSS links are absolute');
for(const file of ['assets/site.css','assets/site.js']){
 const expected=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,10);
 assert.ok(homepage.includes(`${file}?v=${expected}`),`${file}: cache version is current; rebuild if stale`);
}
console.log(`PASS: ${files.length} generated pages, ${references} local references, image dimensions, opt-in media, static content, RSS, cache versions.`);
