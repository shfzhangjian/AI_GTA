const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=name=>path.join(root,name);
function testUrl(){const url=new URL(process.env.GAME_URL||'http://127.0.0.1:8731/');url.searchParams.set('test','1');return url.href;}
async function launchBrowser(){
 const options={headless:true,args:['--disable-background-timer-throttling']};
 const chromePath=process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'');
 if(chromePath&&fs.existsSync(chromePath))options.executablePath=chromePath;
 return chromium.launch(options);
}
module.exports={root,output,testUrl,launchBrowser};
