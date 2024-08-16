const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');                         
// Fungsi untuk mendapatkan commit terakhir
function getLastCommit() {
  return execSync('git log -1 --pretty=%B').toString().trim();
}

// Fungsi untuk mendapatkan file yang diubah sejak commit terakhir
function getChangedFiles() {
  return execSync('git diff --name-only HEAD~1').toString().trim().split('\n');
}

// Fungsi untuk menentukan versi baru berdasarkan perubahan file
function determineVersionType(changedFiles) {
  let versionType = 'patch'; // Defaultnya adalah patch

  changedFiles.forEach(file => {
    const ext = path.extname(file);
    if (ext === '.js') { // Sesuaikan dengan bahasa pemrograman Anda
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('BREAKING CHANGE')) {
        versionType = 'major';
      } else if (content.includes('feature')) {
        versionType = 'minor';
      }
    }
  });

  return versionType;
}

// Fungsi untuk meningkatkan versi di package.json
function updateVersion(versionType) {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  let [major, minor, patch] = packageJson.version.split('.').map(Number);

  if (versionType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (versionType === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  packageJson.version = `${major}.${minor}.${patch}`;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`Version bumped to ${packageJson.version}`);
}

// Implementasi utama
function main() {
  const changedFiles = getChangedFiles();
  const versionType = determineVersionType(changedFiles);
  updateVersion(versionType);

  // Commit perubahan versi
  execSync('git add package.json');
  execSync(`git commit -m "chore: bump version to ${require('./package.json').version}"`);
  execSync('git push');
}

main();