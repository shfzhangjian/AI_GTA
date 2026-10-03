const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
async function build() {
 const result = await esbuild.build({entryPoints:[path.join(__dirname,'app.js')],bundle:true,minify:true,format:'iife',target:['es2020'],legalComments:'inline',write:false});
 const script = result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
 const html = fs.readFileSync(path.join(__dirname,'template.html'),'utf8').replace('<!-- APPLICATION_BUNDLE -->',()=>'<script>'+script+'</script>').replace(/[\t ]+$/gm,'');
 fs.writeFileSync(path.join(__dirname,'index.html'),html);
 console.log('Built standalone index.html — '+(Buffer.byteLength(html)/1024).toFixed(0)+' KB');
}
build().catch(error=>{console.error(error);process.exitCode=1;});
