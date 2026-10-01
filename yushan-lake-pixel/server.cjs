const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT || 4178);
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };
    const headers={ 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return;}
      const start=match[1]?Number(match[1]):Math.max(0,data.length-Number(match[2]));
      const end=match[1]?(match[2]?Math.min(Number(match[2]),data.length-1):data.length-1):data.length-1;
      if(start>end||start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));return;
    }
    res.writeHead(200, { ...headers, 'Content-Length':data.length });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Yushan Lake: http://127.0.0.1:${port}`));
