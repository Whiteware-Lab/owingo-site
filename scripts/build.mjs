import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {newest, releaseMarkup} from './catalog.mjs';
const root = new URL('../', import.meta.url);
const file = name => new URL(name, root);
const catalog = process.argv[2] ? JSON.parse(await readFile(process.argv[2],'utf8')) : [];
const android = newest(catalog,'android');
const windows = newest(catalog,'windows');
const replacements = {...releaseMarkup(android),...Object.fromEntries(Object.entries(releaseMarkup(windows,'windows')).map(([k,v])=>['WINDOWS_'+k,v]))};
const html = (await readFile(file('index.html'),'utf8')).replace(/[{][{]([A-Z_]+)[}][}]/g, (_, key) => {
  if (!Object.hasOwn(replacements,key)) throw new Error('Unknown placeholder '+key);
  return replacements[key];
});
const newline=String.fromCharCode(10);
await mkdir(file('dist/assets/'),{recursive:true});
await Promise.all([
  writeFile(file('dist/index.html'),html),copyFile(file('styles.css'),file('dist/styles.css')),
  copyFile(file('assets/owingo.png'),file('dist/assets/owingo.png')),
  writeFile(file('dist/.nojekyll'),''),
  writeFile(file('dist/assets/release.json'),JSON.stringify([...new Set([android,windows].filter(Boolean))],null,2)+newline),
  writeFile(file('dist/latest-build.txt'),String(android?.build ?? 0)+newline),
  writeFile(file('dist/latest-windows-build.txt'),String(windows?.build ?? 0)+newline),
]);
