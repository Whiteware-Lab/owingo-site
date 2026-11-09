export const repo = 'Whiteware-Lab/owingo-site';
export const maxBuild = 2100000000;
const semver = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
export function validateRelease(manifest, release) {
  if (release.draft || !release.published_at || !manifest || manifest.schemaVersion !== 1 ||
      typeof manifest.version !== 'string' || !semver.test(manifest.version) ||
      !Number.isInteger(manifest.build) || manifest.build < 1 || manifest.build > maxBuild ||
      !Array.isArray(manifest.artifacts)) return null;
  const tag = `v${manifest.version}-build.${manifest.build}${release.prerelease ? '-beta' : ''}`;
  if (release.tag_name !== tag || manifest.artifacts.length !== 1) return null;
  const name = `owingo-${manifest.version}-build.${manifest.build}-android.apk`;
  const artifact = manifest.artifacts[0];
  if (!artifact || artifact.platform !== 'android' || artifact.name !== name ||
      !Number.isSafeInteger(artifact.bytes) || artifact.bytes < 1 ||
      typeof artifact.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(artifact.sha256)) return null;
  const asset = release.assets?.find(a => a.name === name && a.state === 'uploaded');
  const checksums = release.assets?.find(a => a.name === 'SHA256SUMS.txt' && a.state === 'uploaded');
  if (!asset || !checksums || asset.size !== artifact.bytes ||
      asset.digest !== `sha256:${artifact.sha256}`) return null;
  const publishedAt = new Date(release.published_at);
  if (!Number.isFinite(publishedAt.getTime())) return null;
  return {schemaVersion:1, version:manifest.version, build:manifest.build,
    channel:release.prerelease ? 'beta' : 'stable', tag, publishedAt:publishedAt.toISOString(),
    artifacts:[{platform:'android',name,bytes:artifact.bytes,sha256:artifact.sha256}]};
}

export const newest = entries => [...entries].sort((a,b) => b.build-a.build ||
  b.publishedAt.localeCompare(a.publishedAt))[0] ?? null;

export function releaseMarkup(release) {
  if (!release) return {RELEASE_META:'DOWNLOAD ANDROID',
    RELEASE_STATUS:'Il download pubblico non è ancora disponibile. La prima release firmata comparirà qui.',
    DOWNLOAD_ACTION:'',RELEASE_LINKS:''};
  const asset = release.artifacts[0];
  const base = `https://github.com/${repo}/releases`;
  const tag = encodeURIComponent(release.tag);
  const size = new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(asset.bytes/1048576);
  const date = new Intl.DateTimeFormat('it-IT',{dateStyle:'medium',timeZone:'Europe/Rome'}).format(new Date(release.publishedAt));
  return {RELEASE_META:`${release.channel === 'beta' ? 'BETA' : 'ULTIMA VERSIONE'} · ${release.version} · BUILD ${release.build}`,
    RELEASE_STATUS:`APK firmato · ${size} MiB · ${date}. Android può chiedere di autorizzare l’installazione dal browser.`,
    DOWNLOAD_ACTION:`<a class="button" href="${base}/download/${tag}/${asset.name}">Scarica APK <span aria-hidden="true">↓</span></a>`,
    RELEASE_LINKS:`<a href="${base}/tag/${tag}">Note di rilascio</a><a href="${base}/download/${tag}/SHA256SUMS.txt">Checksum SHA-256</a>`};
}
