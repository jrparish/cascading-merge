const { execSync } = require('child_process');

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const currentVersion = currentBranch.slice(currentBranch.indexOf('/') + 1).trim();

console.debug('currentBranch', currentBranch);
console.debug('currentVersion', currentVersion);

if (currentBranch === 'develop' || !currentBranch.startsWith('release')) {
  return;
}

const allBranches = execSync('git branch -r --format=%(refname:short)').toString();
let [nextBranch] = allBranches
  .split(/\r?\n/)
  .map(branch => branch.slice(branch.indexOf('/') + 1).trim())
  .filter(branch => branch && branch.startsWith('release'))
  .filter(branch => branch > currentBranch);

if (!nextBranch) {
  nextBranch = 'develop';
}

console.debug('nextBranch', nextBranch);

execSync(`git checkout ${nextBranch}`);
execSync(`git merge ${currentBranch}`);
execSync(`git push origin ${nextBranch}`);
