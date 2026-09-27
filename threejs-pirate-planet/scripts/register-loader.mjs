// register-loader.mjs — 注册上面的 loader
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('./json-loader.mjs', pathToFileURL('./scripts/'));
