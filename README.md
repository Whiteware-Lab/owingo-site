# Owingo — sito pubblico

GitHub Pages: https://whiteware-lab.github.io/owingo-site/

Questo repository ospita solo il sito statico. Il codice Flutter, i segreti
di firma e gli artefatti interni rimangono nel repository privato di Owingo.
Gli APK pubblici sono allegati alle **GitHub Releases**, non committati.

## Sviluppo e aggiornamenti

Node.js 22+; nessuna dipendenza npm. `npm test` verifica il catalogo,
`npm run build` prepara `dist/` senza annunci di download non verificati.
In produzione, Pages legge le release già pubblicate ad ogni push su `main`,
evento `release: published` o avvio manuale. Sceglie il build Android più alto
con manifest valido, checksum e APK con digest corrispondente. La pagina e
`latest-build.txt` vengono pubblicati insieme; `assets/release.json` espone
anche i metadati. Nessun token o chiamata API GitHub nel browser.

Una release usa tag `vVERSION-build.NUMERO` (suffisso `-beta` se prerelease)
e contiene `owingo-VERSION-build.NUMERO-android.apk`, `release.json` e
`SHA256SUMS.txt`. Usa lo strumento `tools/publish-android.mjs` nel repository
privato dell’app per verificare firma, build, fingerprint OAuth e allegati
prima di pubblicare. Non caricare APK con firma di debug. Una build già
pubblicata è immutabile: le correzioni incrementano sempre il numero build.

L’app confronta il proprio `versionCode` con il feed. Se esiste una build più
recente propone di aprire il sito, senza installare nulla automaticamente.
