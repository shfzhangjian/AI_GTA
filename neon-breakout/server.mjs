import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base = path.dirname(fileURLToPath(import.meta.url));
const root = process.argv.includes('--dist') ? path.join(base, 'dist') : base;
const port = Number(process.env.PORT || 5199);
const mime = {'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let url; try {url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400).end();return;}
  const target=path.resolve(root,'.'+(url==='/'?'/index.html':url));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end('文件未找到');return;}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}).end(data);});
}).listen(port,'0.0.0.0',()=>console.log(`霓城突围 http://127.0.0.1:${port}`));
