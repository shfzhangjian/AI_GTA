import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
for(const name of ['index.html','style.css','src','vendor']) fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
console.log('构建完成：dist/（静态网页，无需联网）');
