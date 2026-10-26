const fs = require('fs');
const https = require('https');
const path = require('path');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', reject);
  });
}

async function main() {
  const toolsDir = path.resolve('tools');
  if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir, { recursive: true });

  const uberJar = path.join(toolsDir, 'uber-apk-signer-1.3.0.jar');
  const templateApk = path.join(toolsDir, 'template-webview.apk');

  if (!fs.existsSync(uberJar)) {
    console.log('Downloading uber-apk-signer-1.3.0.jar...');
    await downloadFile(
      'https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar',
      uberJar
    );
    console.log('Downloaded uber-apk-signer:', fs.statSync(uberJar).size, 'bytes');
  } else {
    console.log('uber-apk-signer already present:', fs.statSync(uberJar).size, 'bytes');
  }

  if (!fs.existsSync(templateApk)) {
    console.log('Downloading template-webview.apk...');
    await downloadFile(
      'https://github.com/mikespub-archive/android-webview/releases/download/v1.28/app-release.apk',
      templateApk
    );
    console.log('Downloaded template-webview.apk:', fs.statSync(templateApk).size, 'bytes');
  } else {
    console.log('template-webview.apk already present:', fs.statSync(templateApk).size, 'bytes');
  }
}

main().catch(err => {
  console.error('Error preparing tools:', err);
  process.exit(1);
});
