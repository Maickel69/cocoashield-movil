const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = __dirname;
const configPath = path.join(projectDir, 'capacitor.config.ts');
const backupPath = path.join(projectDir, 'capacitor.config.ts.bak');
const vercelUrl = 'https://dist-eight-kappa-84.vercel.app';

console.log('--- COCOASHIELD HYBRID APK BUILDER ---');
console.log(`Vercel Target URL: ${vercelUrl}`);

try {
  // 1. Backup capacitor.config.ts
  console.log('1. Backing up capacitor.config.ts...');
  fs.copyFileSync(configPath, backupPath);

  // 2. Modify capacitor.config.ts to point server.url to Vercel
  console.log('2. Configuring capacitor.config.ts for Hybrid mode...');
  let configText = fs.readFileSync(configPath, 'utf8');

  // Replace or inject the server block pointing to Vercel URL
  const serverBlock = `server: {
    url: '${vercelUrl}',
    cleartext: true,
    androidScheme: 'https'
  },`;

  if (configText.includes('server:')) {
    // Replace existing server block
    configText = configText.replace(/server:\s*\{[\s\S]*?\},\s*/g, `${serverBlock}\n  `);
  } else {
    // Inject before the closing bracket of config
    configText = configText.replace(/export default config;/g, `// Server injected\n  ${serverBlock}\n\nexport default config;`);
  }
  
  fs.writeFileSync(configPath, configText, 'utf8');
  console.log('Config updated successfully.');

  // 3. Run npm run build
  console.log('3. Running npm run build (compiling web assets)...');
  execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });

  // 4. Run npx cap sync android
  console.log('4. Syncing assets with Capacitor Android native folder...');
  execSync('npx cap sync android', { cwd: projectDir, stdio: 'inherit' });

  // 5. Run gradlew.bat assembleDebug
  console.log('5. Compiling Android APK via Gradle...');
  const androidDir = path.join(projectDir, 'android');
  execSync('gradlew.bat assembleDebug', { cwd: androidDir, stdio: 'inherit' });
  console.log('Gradle build finished successfully.');

  // 6. Locate and copy the output APK to the Desktop
  console.log('6. Locating output APK...');
  const apkSourcePath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  
  if (!fs.existsSync(apkSourcePath)) {
    throw new Error(`Output APK not found at: ${apkSourcePath}`);
  }

  // Determine user's Desktop paths (standard and OneDrive)
  const homeDir = process.env.USERPROFILE || 'C:\\Users\\HP';
  const desktopPaths = [
    path.join(homeDir, 'Desktop'),
    path.join(homeDir, 'OneDrive', 'Desktop')
  ];

  let copied = false;
  for (const deskPath of desktopPaths) {
    if (fs.existsSync(deskPath)) {
      const destApkPath = path.join(deskPath, 'CocoaShield-AI-Hybrid.apk');
      console.log(`Copying APK to Desktop: ${destApkPath}`);
      fs.copyFileSync(apkSourcePath, destApkPath);
      copied = true;
    }
  }

  if (!copied) {
    const destApkPath = path.join(projectDir, 'CocoaShield-AI-Hybrid.apk');
    console.log(`Desktop not found. Copying APK to local folder: ${destApkPath}`);
    fs.copyFileSync(apkSourcePath, destApkPath);
  }

  // Also copy to C:\Users\HP\Downloads\metodologia\pruebas\
  const pruebasDir = 'C:\\Users\\HP\\Downloads\\metodologia\\pruebas';
  if (!fs.existsSync(pruebasDir)) {
    fs.mkdirSync(pruebasDir, { recursive: true });
  }
  const destPruebasPath = path.join(pruebasDir, 'CocoaShield-AI-Hybrid.apk');
  console.log(`Copying APK to pruebas folder: ${destPruebasPath}`);
  fs.copyFileSync(apkSourcePath, destPruebasPath);

  console.log('APK hybrid build completed successfully!');

} catch (err) {
  console.error('❌ Error during the build process:', err.message);
} finally {
  // 7. Restore backup
  if (fs.existsSync(backupPath)) {
    console.log('7. Restoring capacitor.config.ts backup...');
    fs.copyFileSync(backupPath, configPath);
    fs.unlinkSync(backupPath);
    console.log('Capacitor config restored.');
  }
}
