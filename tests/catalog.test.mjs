import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRelease, newest, releaseMarkup} from '../scripts/catalog.mjs';
const artifact={platform:'android',name:'owingo-0.8.0-build.14-android.apk',bytes:1000,sha256:'a'.repeat(64)};
const manifest={schemaVersion:1,version:'0.8.0',build:14,artifacts:[artifact]};
const release={tag_name:'v0.8.0-build.14-beta',prerelease:true,published_at:'2026-11-09T12:00:00Z',assets:[
  {name:artifact.name,size:artifact.bytes,state:'uploaded',digest:`sha256:${artifact.sha256}`},
  {name:'SHA256SUMS.txt',state:'uploaded'},
]};
test('Published release yields fixed trusted links and build',()=>{
  const entry=validateRelease(manifest,release);
  assert.equal(entry.build,14);
  assert.match(releaseMarkup(entry).DOWNLOAD_ACTION,/github\.com\/Whiteware-Lab\/owingo-site\/releases\/download\/v0\.8\.0-build\.14-beta\/owingo/);
});
test('Drafts, malformed versions, missing assets and mismatched digest cannot be promoted',()=>{
  assert.equal(validateRelease(manifest,{...release,draft:true}),null);
  assert.equal(validateRelease({...manifest,version:'<script>'},release),null);
  assert.equal(validateRelease(manifest,{...release,assets:[]}),null);
  assert.equal(validateRelease(manifest,{...release,assets:[{...release.assets[0],digest:'sha256:wrong'},release.assets[1]]}),null);
});
test('No release yields no dead download link; higher build wins',()=>{
  assert.equal(releaseMarkup(null).DOWNLOAD_ACTION,'');
  const entry=validateRelease(manifest,release);
  assert.equal(newest([{...entry,build:12},entry]).build,14);
});
test('Independent Windows ZIP and Android APK releases have separate feeds',()=>{
  const win={...artifact,platform:'windows',name:'owingo-0.8.0-build.14-windows.zip'};
  const winAsset={...release.assets[0],name:win.name};
  const entry=validateRelease({...manifest,artifacts:[artifact,win]},{...release,assets:[...release.assets,winAsset]});
  assert.equal(newest([entry],'windows').build,14);
  assert.match(releaseMarkup(entry,'windows').DOWNLOAD_ACTION,/windows\.zip/);
  assert.equal(newest([validateRelease(manifest,release)],'windows'),null);
  assert.equal(validateRelease({...manifest,artifacts:[artifact,artifact]},release),null);
});
