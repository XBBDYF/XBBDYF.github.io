// Shared PSP project presentation for modern and classic editions.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'..');
const group = '1103558445';
const version = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,10);
function assets(prefix='') {
 return `<link rel="stylesheet" href="${prefix}assets/project-psp.css?v=${version('assets/project-psp.css')}"><script src="${prefix}assets/project-psp.js?v=${version('assets/project-psp.js')}" defer></script>`;
}
function content(prefix='', deferred=true) {
 return `<p class="psp-kicker">MELODY / PSP MUSIC PLAYER</p><h2 id="psp-project-title">PSP 音乐播放器</h2><p id="psp-project-description" class="psp-description">想了解项目详情与后续进展？欢迎加入 <strong>PSP网易云交流群</strong>，和大家一起交流。</p><div class="psp-group-layout"><figure class="psp-qr"><img ${deferred?'data-src':'src'}="${prefix}assets/images/psp-qq-group.png" alt="PSP网易云交流群二维码，群号 ${group}" width="229" height="297" loading="lazy" decoding="async"><figcaption>使用 QQ 扫码，或保存图片后识别</figcaption></figure><div class="psp-group-info"><p class="psp-group-label">QQ 交流群</p><h3>PSP网易云交流群</h3><p class="psp-group-number">群号：<strong>${group}</strong></p><button class="psp-copy" type="button" data-copy-group="${group}" hidden>复制群号</button><p class="psp-copy-status" role="status" aria-live="polite"></p><p class="psp-instructions">打开 QQ，搜索群号 <strong>${group}</strong>，申请加入即可了解更多。</p><a class="psp-save-qr" href="${prefix}assets/images/psp-qq-group.png" download="PSP网易云交流群.png">保存群聊二维码 ↓</a></div></div>`;
}
function dialog(prefix='') {
 return `<dialog id="psp-project-dialog" class="psp-dialog" aria-labelledby="psp-project-title" aria-describedby="psp-project-description"><form method="dialog" class="psp-close-form"><button class="psp-close" type="submit" aria-label="关闭项目介绍" autofocus>×</button></form>${content(prefix,true)}</dialog>`;
}
function modernCard() {
 return `<a class="project-card psp-project-card" href="project/psp.html" data-psp-project><img class="psp-project-cover" src="assets/images/psp-melody.png" alt="MELODY 音乐播放器，黑底红色唱片封面" width="480" height="272" loading="lazy" decoding="async"><div class="project-bottom"><span class="eyebrow">01 / PSP · MUSIC PLAYER</span><h3>PSP 音乐播放器 <span>↗</span></h3><p>MELODY · 加入交流群，了解项目详情与后续进展。</p><span class="psp-card-cta">加入群聊了解 →</span></div></a>`;
}
function retroCard() {
 return `<a class="psp-retro-project" href="../project/psp.html" data-psp-project><img src="../assets/images/psp-melody.png" alt="MELODY 音乐播放器项目封面" width="480" height="272" loading="lazy" decoding="async"><div><strong>PSP 音乐播放器</strong><span>MELODY / MUSIC · VIDEO</span><p>了解项目详情与后续进展，欢迎加入 PSP网易云交流群。</p><b>[ 加入群聊了解 &gt;&gt; ]</b></div></a>`;
}
function buildPage() {
 const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>PSP 音乐播放器 · 加入交流群了解</title><meta name="description" content="了解 PSP 音乐播放器项目，加入 PSP网易云交流群，群号 ${group}。"><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">${assets('../')}</head><body class="psp-detail-page"><main class="psp-detail"><img class="psp-detail-cover" src="../assets/images/psp-melody.png" alt="MELODY 音乐播放器" width="480" height="272">${content('../',false).replace('<h2 id="psp-project-title">','<h1 id="psp-project-title">').replace('</h2>','</h1>')}<nav class="psp-return" aria-label="返回博客"><a href="../index.html#projects">← 返回主页项目</a><a href="../retro/index.html#games">返回复古版项目 →</a></nav></main></body></html>`;
 fs.mkdirSync(path.join(root,'project'),{recursive:true});
 fs.writeFileSync(path.join(root,'project/psp.html'),html);
}
module.exports={assets,dialog,modernCard,retroCard,buildPage};
if(require.main===module){buildPage();console.log('Built project/psp.html');}
