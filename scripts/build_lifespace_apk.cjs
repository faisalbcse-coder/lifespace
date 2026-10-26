const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function buildLifespaceApk() {
  console.log('=== Building Lifespace Android APK v1.0.0.2 ===');
  const baseDir = path.resolve(__dirname, '..');
  const toolsDir = path.join(baseDir, 'tools');
  const templateApk = path.join(toolsDir, 'template-webview.apk');
  const uberJar = path.join(toolsDir, 'uber-apk-signer-1.3.0.jar');
  const updateSettingsJava = path.join(baseDir, 'scripts', 'UpdateSettings.java');
  const keystore = path.join(baseDir, 'lifespace.keystore');

  if (!fs.existsSync(templateApk)) {
    throw new Error('template-webview.apk not found at ' + templateApk);
  }
  if (!fs.existsSync(uberJar)) {
    throw new Error('uber-apk-signer-1.3.0.jar not found at ' + uberJar);
  }

  // Ensure keystore exists
  if (!fs.existsSync(keystore)) {
    console.log('Generating production release keystore...');
    execSync(
      `keytool -genkeypair -v -keystore "${keystore}" -alias lifespace -keyalg RSA -keysize 2048 -validity 10000 -storepass lifespace2026 -keypass lifespace2026 -dname "CN=Lifespace, OU=Mobile, O=Lifespace Notekori, L=Dhaka, ST=Dhaka, C=BD"`
    );
  }

  const buildApk = path.join(toolsDir, 'lifespace-build.apk');
  if (fs.existsSync(buildApk)) fs.unlinkSync(buildApk);
  fs.copyFileSync(templateApk, buildApk);
  console.log('Copied template APK to workspace.');

  // Create updated settings.json pointing to https://lifespace.notekori.com
  const tempSettingsPath = path.join(toolsDir, 'temp-settings.json');
  const settings = {
    sites: [
      {
        url: 'https://lifespace.notekori.com',
        title: 'LifeSpace'
      }
    ],
    other: 'https://lifespace.notekori.com',
    match: [
      ['host', 'equals', 'lifespace.notekori.com']
    ],
    skip: [],
    remote_debug: false,
    console_log: false,
    js_interface: false,
    context_menu: false,
    not_matching: false,
    local_sites: false,
    update_zip: '',
    web_settings: {
      JavaScriptEnabled: true,
      DomStorageEnabled: true,
      DatabaseEnabled: true,
      ForceDark: "FORCE_DARK_OFF",
      force_dark: "off"
    },
    source: 'assets',
    version: '1.0.0.2',
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(tempSettingsPath, JSON.stringify(settings, null, 2), 'utf-8');

  // In-place update of assets/settings.json using Java ZipFileSystem
  // This preserves resources.arsc (STORED/uncompressed) and classes.dex untouched!
  console.log('Updating assets/settings.json in-place...');
  execSync(`java "${updateSettingsJava}" "${buildApk}" "${tempSettingsPath}"`);
  fs.unlinkSync(tempSettingsPath);

  // Zipalign and sign with v1, v2, and v3 schemes using uber-apk-signer
  console.log('Zipaligning and signing APK (v1, v2, v3)...');
  execSync(
    `java -jar "${uberJar}" -a "${buildApk}" --ks "${keystore}" --ksAlias lifespace --ksPass lifespace2026 --ksKeyPass lifespace2026 --allowResign --overwrite --verbose`
  );

  // Verify resulting APK
  console.log('Verifying APK installation validity...');
  const verifyOut = execSync(`java -jar "${uberJar}" -a "${buildApk}" --onlyVerify`).toString();
  console.log(verifyOut.trim());

  // Copy to destination paths
  const pubDownloads = path.join(baseDir, 'public', 'downloads');
  if (!fs.existsSync(pubDownloads)) fs.mkdirSync(pubDownloads, { recursive: true });

  const targetApk = path.join(pubDownloads, 'lifespace.apk');
  const rootPubApk = path.join(baseDir, 'public', 'lifespace.apk');
  fs.copyFileSync(buildApk, targetApk);
  fs.copyFileSync(buildApk, rootPubApk);

  // Also sync to personal-management-software-live if present
  const liveDir = path.join(baseDir, 'personal-management-software-live');
  if (fs.existsSync(liveDir)) {
    const livePubDownloads = path.join(liveDir, 'public', 'downloads');
    if (!fs.existsSync(livePubDownloads)) fs.mkdirSync(livePubDownloads, { recursive: true });
    fs.copyFileSync(buildApk, path.join(livePubDownloads, 'lifespace.apk'));
    fs.copyFileSync(buildApk, path.join(liveDir, 'public', 'lifespace.apk'));
  }

  // Also update .next/standalone if present
  const standalonePub = path.join(baseDir, '.next', 'standalone', 'public', 'downloads', 'lifespace.apk');
  if (fs.existsSync(path.dirname(standalonePub))) {
    fs.copyFileSync(buildApk, standalonePub);
  }

  const stat = fs.statSync(targetApk);
  const sizeMb = (stat.size / 1024 / 1024).toFixed(2);
  console.log(`\n🎉 SUCCESS! Lifespace APK v1.0.0.2 generated successfully!`);
  console.log(`Path: ${targetApk}`);
  console.log(`File Size: ${sizeMb} MB (${stat.size} bytes)`);

  // Clean build file
  if (fs.existsSync(buildApk)) fs.unlinkSync(buildApk);
}

buildLifespaceApk();
