export const repo = 'Whiteware-Lab/owingo-site';
export const maxBuild = 2100000000;
const semver = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
export function validateRelease(manifest, release) {
  if (release.draft || !release.published_at || !manifest || manifest.schemaVersion !== 1 ||
      typeof manifest.version !== 'string' || !semver.test(manifest.version) ||
      !Number.isInteger(manifest.build) || manifest.build < 1 || manifest.build > maxBuild ||
      !Array.isArray(manifest.artifacts)) return null;
  const tag = `v${manifest.version}-build.${manifest.build}${release.prerelease ? '-beta' : ''}`;
  if (release.tag_name !== tag || !manifest.artifacts.length || manifest.artifacts.length > 2) return null;
  const artifacts = [];
  for (const artifact of manifest.artifacts) {
    if (!artifact || !['android','windows'].includes(artifact.platform) || artifacts.some(a=>a.platform===artifact.platform)) return null;
    const name = `owingo-${manifest.version}-build.${manifest.build}-${artifact.platform}.${artifact.platform==='android'?'apk':'zip'}`;
    if (artifact.name !== name ||
      !Number.isSafeInteger(artifact.bytes) || artifact.bytes < 1 ||
      typeof artifact.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(artifact.sha256)) return null;
    const asset = release.assets?.find(a => a.name === name && a.state === 'uploaded');
    if (!asset || asset.size !== artifact.bytes || asset.digest !== `sha256:${artifact.sha256}`) return null;
    artifacts.push({platform:artifact.platform,name,bytes:artifact.bytes,sha256:artifact.sha256});
  }
  if (!release.assets?.some(a => a.name === 'SHA256SUMS.txt' && a.state === 'uploaded')) return null;
  const publishedAt = new Date(release.published_at);
  if (!Number.isFinite(publishedAt.getTime())) return null;
  return {schemaVersion:1, version:manifest.version, build:manifest.build,
    channel:release.prerelease ? 'beta' : 'stable', tag, publishedAt:publishedAt.toISOString(),
    artifacts};
}

export const newest = (entries, platform='android') => entries.filter(e=>e.artifacts.some(a=>a.platform===platform)).sort((a,b) => b.build-a.build ||
  b.publishedAt.localeCompare(a.publishedAt))[0] ?? null;

export function releaseMarkup(release, platform='android') {
  const windows=platform==='windows';
  if (!release) return {RELEASE_META:windows?'DOWNLOAD WINDOWS':'DOWNLOAD ANDROID',
    RELEASE_STATUS:'Il download pubblico non è ancora disponibile.',
    DOWNLOAD_ACTION:'',RELEASE_LINKS:''};
  const asset = release.artifacts.find(a=>a.platform===platform);
  const base = `https://github.com/${repo}/releases`;
  const tag = encodeURIComponent(release.tag);
  const size = new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(asset.bytes/1048576);
  const date = new Intl.DateTimeFormat('it-IT',{dateStyle:'medium',timeZone:'Europe/Rome'}).format(new Date(release.publishedAt));
  return {RELEASE_META:`${release.channel === 'beta' ? 'BETA' : 'ULTIMA VERSIONE'} · ${release.version} · BUILD ${release.build}`,
    RELEASE_STATUS:windows?`ZIP portabile x64 · ${size} MiB · ${date}. Estrai tutta la cartella e avvia owingo.exe.`:`APK firmato · ${size} MiB · ${date}. Android può chiedere di autorizzare l’installazione dal browser.`,
    DOWNLOAD_ACTION:`<a class="button" href="${base}/download/${tag}/${asset.name}">Scarica ${windows?'ZIP':'APK'} <span aria-hidden="true">↓</span></a>`,
    RELEASE_LINKS:`<a href="${base}/tag/${tag}">Note di rilascio</a><a href="${base}/download/${tag}/SHA256SUMS.txt">Checksum SHA-256</a>`};
}
