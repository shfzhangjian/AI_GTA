import {access} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const moduleId=process.env.PUPPETEER_MODULE?pathToFileURL(process.env.PUPPETEER_MODULE).href:'puppeteer-core';
export const puppeteer=(await import(moduleId)).default;
export const baseURL=process.env.JELLY_BASE_URL||'http://127.0.0.1:9017/';
const candidates=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
export let executablePath;
for(const path of candidates){try{await access(path);executablePath=path;break}catch{}}
if(!executablePath)throw new Error('Chrome not found. Set CHROME_PATH to your installed browser executable.');
export const gpuArgs=['--enable-unsafe-webgpu','--ignore-gpu-blocklist','--no-first-run',...(process.platform==='win32'?['--use-angle=d3d11']:[])];
