import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const esbuild=process.env.ESBUILD_PATH?await import(pathToFileURL(process.env.ESBUILD_PATH).href):await import('esbuild');
const result=await esbuild.build({entryPoints:[path.join(root,'src/app.js')],bundle:true,write:false,format:'iife',platform:'browser',target:'es2020',minify:true,legalComments:'inline',alias:{'three/addons':path.join(root,'vendor/addons'),'three':path.join(root,'vendor/build/three.module.js')}});
const drawings={};for(const key of ['furniture','structure','water'])drawings[key]='data:image/jpeg;base64,'+(await fs.readFile(path.join(root,`public/drawings/${key}.jpg`))).toString('base64');
const artwork='data:image/jpeg;base64,'+(await fs.readFile(path.join(root,'public/art/hall-painting.jpg'))).toString('base64');
const studyPhotos={};for(const key of ['family','cabinet'])studyPhotos[key]='data:image/jpeg;base64,'+(await fs.readFile(path.join(root,`public/study/${key}.jpg`))).toString('base64');
const masterPhotos={door:'data:image/jpeg;base64,'+(await fs.readFile(path.join(root,'public/master/door.jpg'))).toString('base64')};
const entryPhoto='data:image/jpeg;base64,'+(await fs.readFile(path.join(root,'public/entry/door.jpg'))).toString('base64');
const kitchenDiningPhotos={};for(const key of ['gallery','charts','storage','hood'])kitchenDiningPhotos[key]='data:image/jpeg;base64,'+(await fs.readFile(path.join(root,`public/kitchen-dining/${key}.jpg`))).toString('base64');
let html=await fs.readFile(path.join(root,'index.source.html'),'utf8');
const css=await fs.readFile(path.join(root,'src/style.css'),'utf8');
const license=await fs.readFile(path.join(root,'vendor/THREE-LICENSE.txt'),'utf8');
html=html.replace('<head>',()=>`<head>\n<!-- Three.js third-party license:\n${license.replace(/--/g,'—')}\n-->`);
html=html.replace('<link rel="stylesheet" href="/src/style.css" />',()=>`<style>${css}</style>`)
  .replace(/<script type="importmap">[\s\S]*?<\/script>/,'')
  .replace('href="/"','href="#"')
  .replace('src="/public/drawings/furniture.jpg"',()=>`src="${drawings.furniture}"`)
  .replace('<script type="module" src="/src/app.js"></script>',()=>`<script>window.__DRAWINGS=${JSON.stringify(drawings)};window.__ARTWORK=${JSON.stringify(artwork)};window.__STUDY_PHOTOS=${JSON.stringify(studyPhotos)};window.__MASTER_PHOTOS=${JSON.stringify(masterPhotos)};window.__ENTRY_PHOTO=${JSON.stringify(entryPhoto)};window.__KITCHEN_DINING_PHOTOS=${JSON.stringify(kitchenDiningPhotos)};</script><script>${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>`);
const target=path.join(root,'汇成上东-离线预览.html');await fs.writeFile(target,html);await fs.writeFile(path.join(root,'index.html'),html);
console.log(`Standalone HTML: ${target} (${(Buffer.byteLength(html)/1048576).toFixed(2)} MB)`);
