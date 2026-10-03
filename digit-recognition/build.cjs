const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const safe=source=>source.replace(/<\/script/gi,'<\\/script');
const three='/* Three.js r185.1, MIT; see vendor/THREE-LICENSE.txt */\n(function(exports){\n'+read('vendor/three.cjs')+'\n})(window.THREE = {});';
fs.writeFileSync(path.join(__dirname,'vendor/three.browser.js'),three,'utf8');
const html=read('index.html')
  .replace('<link rel="stylesheet" href="film.css">',()=>'<style>\n'+read('film.css')+'\n</style>')
  .replace('<script src="vendor/three.browser.js"></script><script src="handwriting-model.js"></script><script src="film.js"></script>',()=>'<script>\n'+safe(three)+'\n</script>\n<script>\n'+safe(read('handwriting-model.js'))+'\n</script>\n<script>\n'+safe(read('film.js'))+'\n</script>');
fs.writeFileSync(path.join(__dirname,'digit-recognition.html'),html,'utf8');
console.log('Built offline Three.js + SVG animation:',Math.round(Buffer.byteLength(html)/1024),'KiB');
