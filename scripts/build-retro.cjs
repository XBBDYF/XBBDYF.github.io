/* Independent retro edition. node scripts/build-retro.cjs never writes the modern homepage. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {marked} = require('../js/marked.min.js');
const psp = require('./project-psp.cjs');
psp.buildPage();
const ROOT = path.resolve(__dirname, '..');
const siteUrl = new URL(process.env.SITE_URL || 'https://xbbdyf.github.io/');
if (!/^https?:$/.test(siteUrl.protocol)) throw new Error('SITE_URL must be HTTP(S)');
if (!siteUrl.pathname.endsWith('/')) siteUrl.pathname += '/';
const read = file => fs.readFileSync(path.join(ROOT,file),'utf8').replace(/^\uFEFF/,'');
const write = (file,content) => { if (!file.startsWith('retro/')) throw new Error('Retro output must stay in retro/'); fs.mkdirSync(path.dirname(path.join(ROOT,file)),{recursive:true});fs.writeFileSync(path.join(ROOT,file),content); };
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const version = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex').slice(0,10);
const originalFiles = ['index.html','assets/site.css','assets/site.js','scripts/build.cjs'];
const originalHashes = originalFiles.map(file=>version(file));
const manifest = JSON.parse(read('assets/image-manifest.json'));
const defaultCategories = {'1':'技术笔记','2':'技术笔记','3':'折腾记录','4':'生活随笔','5':'生活随笔'};
const articles = JSON.parse(read('articles/list.json')).map(a=>{
  if(!/^[\w-]+$/.test(a.id))throw new Error('Invalid article ID');
  return {...a,category:a.category||defaultCategories[a.id]||'折腾记录',source:read(`articles/${a.id}.md`)};
}).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
const categorySlugs = {'技术笔记':'tech','折腾记录':'notes','生活随笔':'diary'};
const groups = [...new Set(articles.map(a=>a.category))].map(name=>({name,file:`category-${categorySlugs[name]||crypto.createHash('sha256').update(name).digest('hex').slice(0,8)}.html`,articles:articles.filter(a=>a.category===name)}));
const months = [...new Set(articles.map(a=>a.date.slice(0,7)))];
const categoryFile = name => groups.find(g=>g.name===name).file;
const dateLabel = date => date.replaceAll('-','.');
const postLink = (article,prefix='')=>`${prefix}posts/${article.id}.html`;
const articleList = (items,prefix='',mode='compact') => `<ul class="link-list ${mode}">${items.map((a,i)=>`<li><a href="${postLink(a,prefix)}"><span class="list-bullet" aria-hidden="true">${mode==='ranked'?String(i+1).padStart(2,'0'):'·'}</span>${esc(a.title)}</a>${mode==='dated'?`<time datetime="${a.date}">${a.date.slice(5)}</time>`:''}</li>`).join('')}</ul>`;
function panel(title,body,{cls='',more='',id=''}={}){
  return `<section class="panel ${cls}"${id?` id="${id}"`:''}><div class="panel-heading"><h2><span aria-hidden="true">▰</span> ${title}</h2>${more}</div><div class="panel-body">${body}</div></section>`;
}
function calendar(month,prefix=''){
 const [year,m]=month.split('-').map(Number),first=new Date(Date.UTC(year,m-1,1)).getUTCDay(),days=new Date(Date.UTC(year,m,0)).getUTCDate();
 let cells='';
 for(let i=0;i<Math.ceil((first+days)/7)*7;i++){
  const day=i-first+1;
  if(day<1||day>days){cells+='<td class="outside"></td>';continue;}
  const date=`${month}-${String(day).padStart(2,'0')}`,post=articles.find(a=>a.date===date);
  cells+=`<td>${post?`<a href="${postLink(post,prefix)}" title="${esc(post.title)}">${day}</a>`:day}</td>`;
 }
 return `<table class="calendar"><caption>${year} 年 ${String(m).padStart(2,'0')} 月</caption><thead><tr>${['日','一','二','三','四','五','六'].map(d=>`<th scope="col">${d}</th>`).join('')}</tr></thead><tbody>${cells.match(/(?:<td[\s\S]*?<\/td>){7}/g).map(row=>`<tr>${row}</tr>`).join('')}</tbody></table>`;
}
function cover(a,rootPrefix){
 const key=(a.cover||'').replace(/^\//,'');
 const info=manifest.images[key];
 if(info)return `<img src="${rootPrefix}${esc(info.thumbnail)}" alt="" width="${info.width}" height="${info.height}" loading="lazy" decoding="async">`;
 return `<span class="text-cover" aria-hidden="true">${a.category==='技术笔记'?'&lt; / &gt;':'MY BLOG'}<small>代码 · 灵感 · 日常</small></span>`;
}
function shell(title,main,{prefix='',active='首页',toc=[],article=null,project=false}={}){
 const rootPrefix=prefix+'../';
 const newest=articles[0];
 const topLinks=`<a href="${rootPrefix}index.html">返回新版主页</a><span>|</span><a href="${prefix}feed.xml">RSS 订阅</a><span>|</span><a href="mailto:lspby@foxmail.com">写信给我</a>`;
 const nav=[['首页','index.html'],['全部日志','archives.html'],...groups.map(g=>[g.name,g.file]),['小作品','index.html#games'],['关于博主','index.html#profile']];
 const left=panel('博主档案',`<div class="profile-avatar"><img src="${rootPrefix}${manifest.avatar.src}" width="192" height="192" alt="XBBDYF 的头像" loading="lazy" decoding="async"></div><h3 class="profile-name">XBBDYF <span title="欢迎来访">☺</span></h3><p class="profile-role">代码学习者 / MOD 编辑者</p><p class="profile-motto">生活有点慢，折腾不能停。</p><dl class="profile-details"><div><dt>兴趣：</dt><dd>编程、MOD、老硬件</dd></div><div><dt>正在学：</dt><dd>C / C++</dd></div><div><dt>出没地：</dt><dd>代码与游戏之间</dd></div></dl><div class="profile-counts"><a href="${prefix}archives.html"><strong>${articles.length}</strong>篇日志</a><a href="${prefix}index.html#categories"><strong>${groups.length}</strong>个分类</a></div><div class="profile-buttons"><a href="https://github.com/XBBDYF" target="_blank" rel="noopener noreferrer">我的 GitHub</a><a href="mailto:lspby@foxmail.com">给我留言</a></div>`,{id:'profile',cls:'profile-panel'})+
 panel('日志分类',`<ul class="category-list" id="categories">${groups.map(g=>`<li><a href="${prefix}${g.file}"><span>▸ ${esc(g.name)}</span><span>(${g.articles.length})</span></a></li>`).join('')}<li><a href="${prefix}archives.html"><span>▸ 所有日志</span><span>(${articles.length})</span></a></li></ul>`)+
 panel('日志日历',`<div class="calendar-container">${calendar(newest.date.slice(0,7),prefix)}</div><p class="calendar-tip">带下划线的日子，写过日志。</p>`)+
 panel('归档柜',`<ul class="archive-list">${months.map(month=>`<li><a href="${prefix}archives.html#month-${month}">${month.slice(0,4)} 年 ${month.slice(5)} 月</a><span>[${articles.filter(a=>a.date.startsWith(month)).length}]</span></li>`).join('')}</ul>`)+
 panel('我的小标签',`<div class="tag-cloud"><a href="${prefix}${categoryFile('技术笔记')}">HTML / CSS</a><a href="${prefix}${categoryFile('技术笔记')}">JavaScript</a><a href="${prefix}index.html#about-mod">HOI4 MOD</a><a href="${prefix}index.html#about-mod">C / C++</a><a href="${prefix}${categoryFile('生活随笔')}">碎碎念</a><a href="${prefix}index.html#about-mod">老硬件</a></div><div class="web-badges"><span class="web-badge"><b>I ♥</b> WEB</span><span class="web-badge orange"><b>个人</b> 小站</span></div>`);
 const right=panel('站长公告',`<p class="notice-greeting">欢迎来到我的小站！</p><p>这里放着我写的代码、做 MOD 的经历，还有一些生活里的碎碎念。</p><p>不赶时间的话，就坐下来翻几篇吧。<span class="smiley"> ^_^</span></p><p class="notice-sign">—— XBBDYF</p>`,{cls:'notice-panel'})+
 (toc.length?panel('本篇目录',`<nav class="article-toc" aria-label="文章目录">${toc.map(t=>`<a href="#${t.id}" class="level-${t.level}">· ${esc(t.text)}</a>`).join('')}</nav>`):panel('随便翻翻',articleList([...articles].reverse(),prefix,'ranked')))+
 panel('音乐盒',`<div class="music-intro"><span class="music-disc" aria-hidden="true">♫</span><p>给文字配一首歌<br><small>路过，也可以听一会儿</small></p></div><details class="music-box"><summary>打开我的音乐盒</summary><label for="music-track">选择歌曲</label><select id="music-track"><option value="0">心予報</option><option value="1">Oh! Susanna</option><option value="2">Montagem pitty</option><option value="3">天天天国地獄国</option></select><button type="button" id="music-play" class="classic-button" hidden>播放 ▶</button><audio id="retro-audio" controls preload="none" hidden></audio><p id="music-status" role="status">点击播放后加载，不自动播放。</p><noscript><a href="${rootPrefix}music/心予報.mp3">直接打开：心予報</a></noscript></details>`)+
 panel('常去的网站',`<ul class="outgoing-links"><li><a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub <span>代码与项目</span></a></li><li><a href="https://developer.mozilla.org/zh-CN/" target="_blank" rel="noopener noreferrer">MDN Web Docs <span>网页开发手册</span></a></li><li><a href="https://hoi4.paradoxwikis.com/Modding" target="_blank" rel="noopener noreferrer">HOI4 Wiki <span>模组参考</span></a></li></ul>`)+
 panel('来访留个脚印',`<p class="guestbook-copy">有关于代码、MOD 的想法，或者只是想打声招呼？</p><a class="guestbook-link" href="mailto:lspby@foxmail.com">✉ 给博主写一封信</a><p class="guestbook-address">lspby@foxmail.com</p>`,{cls:'guestbook-panel'})+
 `<div class="side-note"><span aria-hidden="true">✦</span> 网络很大，<br>能遇见就是缘分。<small>Thanks for stopping by.</small></div>`;
 const year=new Date().getUTCFullYear();
 return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)} - XBBDYF 的网络日志</title><meta name="description" content="XBBDYF 的复古个人博客，记录网页开发、游戏 MOD 和生活里的小事。"><link rel="icon" href="${rootPrefix}assets/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="XBBDYF 日志订阅" href="${prefix}feed.xml"><link rel="stylesheet" href="${prefix}retro.css?v=${version('retro/retro.css')}"><script src="${prefix}retro.js?v=${version('retro/retro.js')}" defer></script>${project?psp.assets(rootPrefix):''}</head><body data-root="${rootPrefix}"><a class="skip-link" href="#main">跳到正文</a><div class="site-wrap" id="top"><div class="utility-bar"><span>您好，欢迎光临 XBBDYF 的个人博客！</span><div>${topLinks}</div></div><header class="blog-header"><div class="header-title"><a href="${prefix}index.html" class="header-kicker">XBBDYF'S BLOG <span>个人空间 · 网络日志</span></a><h1><a href="${prefix}index.html">XBBDYF 的网络日志</a></h1><p>记录代码，收藏灵感，写下生活中的小事。</p></div><div class="header-decoration" aria-hidden="true"><div class="retro-window"><div class="window-title">My little corner of the web <span>_ □ ×</span></div><div class="window-body"><strong>Hello, world<span class="terminal-cursor">_</span></strong><span>while (curious) { keep_learning(); }</span><p>代码 / 游戏 / 生活</p></div></div><span class="header-star star-one">✦</span><span class="header-star star-two">✧</span></div></header><nav class="main-nav" aria-label="主导航">${nav.map(([name,href])=>`<a href="${prefix}${href}"${active===name?' aria-current="page"':''}>${name}</a>`).join('')}<a class="nav-modern" href="${rootPrefix}index.html">新版主页 »</a></nav><div class="notice-bar"><span class="notice-label">小站广播</span><p>慢慢写，慢慢学；把每一个小想法，留在自己的角落里。</p><span class="edition-label">经典门户版</span></div><div class="portal-grid"><aside class="left-column" aria-label="博主资料与归档">${left}</aside><main class="center-column" id="main">${main}</main><aside class="right-column" aria-label="小站侧栏">${right}</aside></div><footer class="blog-footer"><div class="footer-links"><a href="${prefix}index.html">博客首页</a><span>|</span><a href="${prefix}archives.html">日志归档</a><span>|</span><a href="${rootPrefix}index.html">新版主页</a><span>|</span><a href="${rootPrefix}privacy/">隐私说明</a><span>|</span><a href="mailto:lspby@foxmail.com">联系博主</a></div><p>© ${year} XBBDYF 的网络日志 · 复古样式，同一份记录</p><p class="footer-motto">这里没有什么大事，只有一个人认真留下的小事。<span class="footer-badge">I ♥ MY BLOG</span></p><a href="#top" class="back-top">[ 回到顶部 ↑ ]</a></footer></div></body></html>`;
}
const latest=articles[0];
const feature=panel('最新日志',`<article class="featured-post"><a class="featured-cover" href="${postLink(latest)}" aria-label="阅读：${esc(latest.title)}">${cover(latest,'../')}</a><div class="featured-text"><span class="new-label">NEW</span><h3><a href="${postLink(latest)}">${esc(latest.title)}</a></h3><p>${esc(latest.summary)}</p><p class="featured-meta"><time datetime="${latest.date}">${dateLabel(latest.date)}</time> / ${latest.category}</p><a class="read-more" href="${postLink(latest)}">阅读全文 &gt;&gt;</a></div></article>`,{more:'<a href="archives.html" class="panel-more">全部日志 &gt;&gt;</a>',cls:'featured-panel'});
function listing(items,{filter=false}={}){
 return `${filter?`<form class="retro-search" role="search" hidden><label for="article-search">站内搜索：</label><input id="article-search" type="search" placeholder="输入标题、摘要或分类" autocomplete="off"><button class="classic-button" type="submit">搜索</button></form><p class="search-status" role="status" hidden></p>`:''}<div class="post-rows">${items.map(a=>`<article class="post-row" data-search="${esc([a.title,a.category,a.summary].join(' '))}"><div class="post-row-heading"><span class="post-category">[<a href="${categoryFile(a.category)}">${esc(a.category)}</a>]</span><h3><a href="${postLink(a)}">${esc(a.title)}</a></h3><time datetime="${a.date}">${a.date.slice(5)}</time></div><p>${esc(a.summary)}</p><div class="post-row-footer"><span>作者：XBBDYF</span><a href="${postLink(a)}">阅读全文 &gt;&gt;</a></div></article>`).join('')}</div>${filter?'<div class="search-empty" hidden><p>没有找到对应的日志，试试别的关键词吧。</p><button class="classic-button" type="button" id="clear-search">显示全部日志</button></div>':''}`;
}
const gamePanel=panel('项目展示 · PSP 音乐播放器',psp.retroCard(),{id:'games'});
const home=feature+panel('最近更新',listing(articles,{filter:true}),{more:`<span class="panel-count">共 ${articles.length} 篇</span>`,id:'journal'})+
 `<div class="double-panels">${['技术笔记','生活随笔'].map(name=>panel(esc(name),articleList(articles.filter(a=>a.category===name),'','dated'),{more:`<a class="panel-more" href="${categoryFile(name)}">更多 &gt;</a>`})).join('')}</div>`+
 panel('关于这个小站',`<div class="about-copy" id="about-mod"><p>我是 XBBDYF，一名正在学习的程序员，也是一个喜欢折腾游戏 MOD 的人。</p><p>喜欢做 H5 网页和小项目，做了 3 年多钢铁雄心4 MOD，近期在学 C / C++。写代码之外，喜欢听音乐、研究老硬件与老物件。</p><p class="about-footnote">写得不多，但每一篇都留着当时的想法。欢迎常来看看。</p></div>`,{cls:'about-panel'})+gamePanel+
 `<div class="bottom-strip"><span>▸ 随手记</span> 学一点，做一点，记一点。<a href="mailto:lspby@foxmail.com">有话想说？给我留言 &gt;&gt;</a></div>`;
write('retro/index.html',shell('博客首页',home+psp.dialog('../'),{project:true}));
for(const group of groups){
 const main=`<div class="breadcrumb"><a href="index.html">博客首页</a> &gt; 日志分类 &gt; ${esc(group.name)}</div>`+panel(`分类：${esc(group.name)}`,`<p class="archive-intro">这里收录了 ${group.articles.length} 篇「${esc(group.name)}」。</p>${listing(group.articles,{filter:true})}`,{cls:'category-panel'});
 write(`retro/${group.file}`,shell(group.name,main,{active:group.name}));
}
const archiveMain=`<div class="breadcrumb"><a href="index.html">博客首页</a> &gt; 全部日志</div>`+panel('日志归档',`<p class="archive-intro">按时间翻翻过去的记录，共 ${articles.length} 篇日志。</p>${months.map(month=>`<section class="archive-month" id="month-${month}"><h3>${month.slice(0,4)} 年 ${month.slice(5)} 月 <span>(${articles.filter(a=>a.date.startsWith(month)).length} 篇)</span></h3>${articleList(articles.filter(a=>a.date.startsWith(month)),'','dated')}</section>`).join('')}`);
write('retro/archives.html',shell('全部日志',archiveMain,{active:'全部日志'}));
for(const a of articles){
 const toc=[];
 let html=marked.parse(a.source,{gfm:true});
 html=html.replace(/<h1>([\s\S]*?)<\/h1>/,(_,text)=>text.replace(/<[^>]+>/g,'')===a.title?'':`<p class="original-title">${text}</p>`);
 let i=0;
 html=html.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g,(_,level,text)=>{const id=`section-${++i}`;toc.push({id,level,text:text.replace(/<[^>]+>/g,'')});return `<h${level} id="${id}">${text}</h${level}>`;});
 html=html.replace(/<img\s+([^>]*?)src="([^"]+)"([^>]*?)>/g,(_,before,url,after)=>{
  let key=url.replace(/^\//,'');try{key=decodeURIComponent(key);}catch(_){}
  const info=manifest.images[key],local=fs.existsSync(path.join(ROOT,key));
  return `<img ${before}src="${esc(local?'../../'+(info?.optimized||key):url)}"${after} loading="lazy" decoding="async"${info?` width="${info.width}" height="${info.height}"`:''}>`;
 });
 html=html.replace(/<video\b([^>]*)>/g,(_,attrs)=>`<video${attrs.replace(/\s+poster="封面图链接"/g,'')} preload="none">`).replace(/src="\/articles\//g,'src="../../articles/');
 html=html.replace(/<a href="(https?:[^" ]+)"/g,'<a href="$1" target="_blank" rel="noopener noreferrer"');
 const at=articles.indexOf(a),newer=articles[at-1],older=articles[at+1];
 const main=`<div class="breadcrumb"><a href="../index.html">博客首页</a> &gt; <a href="../${categoryFile(a.category)}">${esc(a.category)}</a> &gt; 正文</div><article class="panel reading-panel"><div class="panel-heading"><h2><span aria-hidden="true">▰</span> 日志正文</h2><a class="panel-more" href="../archives.html">返回日志列表 &gt;&gt;</a></div><header class="article-header"><p class="article-category">[ ${esc(a.category)} ]</p><h2 class="article-title">${esc(a.title)}</h2><p class="article-meta">${dateLabel(a.date)} <span>|</span> 作者：XBBDYF <span>|</span> <a href="mailto:lspby@foxmail.com?subject=${encodeURIComponent('关于日志：'+a.title)}">交流 / 留言</a></p></header><div class="article-content">${html}</div><div class="article-actions"><button class="classic-button copy-page" type="button" hidden>复制本文链接</button><span class="copy-status" role="status"></span><a href="#top">返回顶部 ↑</a></div><div class="post-pagination"><div>较新一篇：${newer?`<a href="${newer.id}.html">${esc(newer.title)}</a>`:'已经是最新的日志了'}</div><div>较早一篇：${older?`<a href="${older.id}.html">${esc(older.title)}</a>`:'已经是最早的日志了'}</div></div><section class="article-letter"><h3>给博主留言</h3><p>读完有什么想说的？欢迎写信聊聊。</p><a href="mailto:lspby@foxmail.com?subject=${encodeURIComponent('关于日志：'+a.title)}">✉ lspby@foxmail.com</a></section></article>`;
 write(`retro/posts/${a.id}.html`,shell(a.title,main,{prefix:'../',active:a.category,toc,article:a}));
}
write('retro/feed.xml',`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>XBBDYF 的网络日志 · 复古版</title><link>${esc(new URL('retro/',siteUrl).href)}</link><description>代码、游戏 MOD 与生活里的小事。</description><language>zh-cn</language>${articles.map(a=>`<item><title>${esc(a.title)}</title><link>${esc(new URL(`retro/posts/${a.id}.html`,siteUrl).href)}</link><guid isPermaLink="false">xbbdyf-retro-${a.id}</guid><description>${esc(a.summary)}</description><pubDate>${new Date(a.date+'T00:00:00+08:00').toUTCString()}</pubDate></item>`).join('')}</channel></rss>`);
originalFiles.forEach((file,i)=>{if(version(file)!==originalHashes[i])throw new Error('Protected modern file changed: '+file);});
console.log(`Built retro/index.html, ${groups.length} category pages, archive, ${articles.length} posts. Modern homepage and assets unchanged.`);
