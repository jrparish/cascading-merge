const { execSync } = require('child_process');

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const currentVersion = currentBranch.slice(currentBranch.indexOf('/') + 1).trim();

const allBranches = execSync('git branch -r --format=%(refname:short)').toString();

const [nextBranch] = allBranches
  .split(/\r?\n/)
  .map(branch => branch.slice(branch.indexOf('/') + 1).trim())
  .filter(branch => branch && branch.startsWith('release'))
  .filter(branch => branch > currentBranch);

execSync(`git checkout ${nextBranch}`);
execSync(`git merge ${currentBranch}`);
execSync(`git push origin ${nextBranch}`);
