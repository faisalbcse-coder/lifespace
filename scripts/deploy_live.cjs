const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function deployLive() {
  const rootDir = path.resolve(__dirname, '..');
  const standaloneDir = path.join(rootDir, '.next', 'standalone');
  const tarPath = path.join(rootDir, 'deploy.tar.gz');

  console.log('=== Preparing standalone bundle for deployment ===');
  
  // 1. Copy public directory to standalone/public
  const srcPublic = path.join(rootDir, 'public');
  const destPublic = path.join(standaloneDir, 'public');
  if (!fs.existsSync(destPublic)) fs.mkdirSync(destPublic, { recursive: true });
  fs.cpSync(srcPublic, destPublic, { recursive: true });
  console.log('Copied public/ to standalone/public');

  // 2. Copy .next/static to standalone/.next/static
  const srcStatic = path.join(rootDir, '.next', 'static');
  const destStatic = path.join(standaloneDir, '.next', 'static');
  if (!fs.existsSync(destStatic)) fs.mkdirSync(destStatic, { recursive: true });
  fs.cpSync(srcStatic, destStatic, { recursive: true });
  console.log('Copied .next/static to standalone/.next/static');

  // 3. Copy prisma/schema.prisma to standalone/prisma
  const destPrisma = path.join(standaloneDir, 'prisma');
  if (!fs.existsSync(destPrisma)) fs.mkdirSync(destPrisma, { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'prisma', 'schema.prisma'), path.join(destPrisma, 'schema.prisma'));

  // 4. Ensure server .env is never overwritten by local development .env
  const standaloneEnv = path.join(standaloneDir, '.env');
  if (fs.existsSync(standaloneEnv)) fs.unlinkSync(standaloneEnv);

  // 5. Create deploy.tar.gz
  if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);
  console.log('Creating deploy.tar.gz...');
  execSync(`tar -czf "${tarPath}" -C "${standaloneDir}" .`);
  console.log('deploy.tar.gz created. Size: ' + (fs.statSync(tarPath).size / 1024 / 1024).toFixed(2) + ' MB');

  // 5. Upload via scp
  console.log('Uploading deploy.tar.gz to server...');
  execSync(`scp -o BatchMode=yes -o StrictHostKeyChecking=no "${tarPath}" swapnoch@hydra.hostseba.com:/home/swapnoch/lifespace.notekori.com/deploy.tar.gz`, { stdio: 'inherit' });

  // 6. Remote extraction & restart
  console.log('Extracting on server & restarting CloudLinux Passenger...');
  const remoteCmd = [
    'cd /home/swapnoch/lifespace.notekori.com',
    'tar -xzf deploy.tar.gz',
    'rm -f deploy.tar.gz',
    'rm -rf .next/server/route-cache',
    'mkdir -p tmp && touch tmp/restart.txt',
    '/usr/bin/cloudlinux-selector restart --json --interpreter nodejs --user swapnoch --app-root /home/swapnoch/lifespace.notekori.com || true'
  ].join(' && ');

  execSync(`ssh -o BatchMode=yes -o StrictHostKeyChecking=no swapnoch@hydra.hostseba.com "${remoteCmd}"`, { stdio: 'inherit' });

  // 7. Remove local tar.gz
  fs.unlinkSync(tarPath);
  console.log('Local deploy.tar.gz cleaned up.');

  console.log('=== Deployment completed successfully! ===');
}

deployLive();
