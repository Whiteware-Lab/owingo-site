import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {newest, releaseMarkup} from './catalog.mjs';
const root = new URL('../', import.meta.url);
const file = name => new URL(name, root);
let catalog = [];
if (process.argv[2]) catalog = JSON.parse(await readFile(process.argv[2],'utf8'));
const release = newest(catalog);
const replacements = releaseMarkup(release);
const html = (await readFile(file('index.html'),'utf8')).replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
  if (!Object.hasOwn(replacements,key)) throw new Error(`Unknown placeholder ${key}`);
  return replacements[key];
});
await mkdir(file('dist/assets/'),{recursive:true});
await Promise.all([
  writeFile(file('dist/index.html'),html),copyFile(file('styles.css'),file('dist/styles.css')),
  copyFile(file('assets/owingo.png'),file('dist/assets/owingo.png')),
  writeFile(file('dist/.nojekyll'),''),writeFile(file('dist/assets/release.json'),JSON.stringify(release?[release]:[],null,2)+'\n'),
  writeFile(file('dist/latest-build.txt'),release ? `${release.build}\n` : '0\n'),
]);
