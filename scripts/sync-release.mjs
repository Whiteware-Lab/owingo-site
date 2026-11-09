import {writeFile} from 'node:fs/promises';
import {repo, validateRelease, newest} from './catalog.mjs';
const token = process.env.GITHUB_TOKEN;
const headers = {Accept:'application/vnd.github+json', 'User-Agent':'Owingo-Pages',
  ...(token ? {Authorization:`Bearer ${token}`} : {})};
const api = `https://api.github.com/repos/${repo}`;
async function request(url, accept) {
  const response = await fetch(url,{headers:{...headers,Accept:accept ?? headers.Accept},signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response;
}
const valid=[];
for (let page=1; ; page++) {
  const releases=await (await request(`${api}/releases?per_page=100&page=${page}`)).json();
  for (const release of releases) {
    if (release.draft || !/^v\d+\.\d+\.\d+-build\.\d+(?:-beta)?$/.test(release.tag_name)) continue;
    const asset=release.assets.find(a=>a.name==='release.json' && a.state==='uploaded' && a.size>0 && a.size<=65536);
    if (!asset || !Number.isSafeInteger(asset.id)) continue;
    const response=await request(`${api}/releases/assets/${asset.id}`,'application/octet-stream');
    let manifest;
    try { manifest=JSON.parse(await response.text()); } catch { continue; }
    const entry=validateRelease(manifest,release);
    if (entry) valid.push(entry);
  }
  if (releases.length<100) break;
}
const entry=newest(valid);
if (entry && valid.filter(v=>v.build===entry.build).length>1) throw new Error('Duplicate published build number');
await writeFile(process.argv[2] ?? 'catalog.json',JSON.stringify(entry?[entry]:[],null,2)+'\n');
console.log(entry ? `Published build: ${entry.build}` : 'No public Android release');
