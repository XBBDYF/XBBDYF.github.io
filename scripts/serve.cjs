// Local preview only. node scripts/serve.cjs [port]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2] || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.gif':'image/gif','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.md':'text/plain; charset=utf-8','.xml':'application/rss+xml; charset=utf-8'};
http.createServer((req,res)=>{
  let filename;
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    filename=path.resolve(root,'.'+pathname);
    if (!filename.startsWith(root+path.sep) && filename!==root) throw new Error('path');
    if (path.relative(root,filename).split(path.sep).some(x=>x.startsWith('.'))) throw new Error('hidden');
  } catch (_) { res.writeHead(400);res.end('Bad request');return; }
  try { if(fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html'); } catch (_) {}
  fs.stat(filename,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    const headers={'Content-Type':types[path.extname(filename).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start=0,end=stat.size-1;
    if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;}
    if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}
    if(range)headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    headers['Content-Length']=end-start+1;
    res.writeHead(range?206:200,headers);
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(filename,{start,end}).on('error',()=>res.destroy()).pipe(res);
  });
}).listen(port,'127.0.0.1',()=>console.log(`Blog preview: http://127.0.0.1:${port}`));
