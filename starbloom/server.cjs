const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT||8093);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4','.srt':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const stat=fs.statSync(file);if(!stat.isFile())throw Error();
  const mime=types[path.extname(file)]||'application/octet-stream';const range=req.headers.range;
  if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}const begin=m[1]?Number(m[1]):Math.max(0,stat.size-Number(m[2]));const end=m[1]&&m[2]?Math.min(Number(m[2]),stat.size-1):stat.size-1;if(begin>end||begin>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}res.writeHead(206,{'Content-Type':mime,'Accept-Ranges':'bytes','Content-Range':`bytes ${begin}-${end}/${stat.size}`,'Content-Length':end-begin+1});if(req.method==='HEAD'){res.end();return;}fs.createReadStream(file,{start:begin,end}).pipe(res);
  }else{res.writeHead(200,{'Content-Type':mime,'Content-Length':stat.size,'Accept-Ranges':'bytes'});if(req.method==='HEAD'){res.end();return;}fs.createReadStream(file).pipe(res);}
 }catch{res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`STARBLOOM: http://127.0.0.1:${port}`));
