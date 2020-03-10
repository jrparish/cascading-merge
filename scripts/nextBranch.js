const { execSync } = require('child_process');
const semver = require('semver');

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString();
const currentVersion = currentBranch.slice(currentBranch.indexOf('/') + 1).trim();

const allBranches = execSync('git branch -r --format=%(refname:short)').toString();

const releaseBranches = allBranches
  .split(/\r?\n/)
  .map(branch => branch.slice(branch.indexOf('/') + 1).trim())
  .filter(branch => branch && branch.startsWith('release'))
  .map(branch => branch.slice(branch.indexOf('/') + 1))
  .filter(version => version > currentVersion);

console.log(currentVersion, releaseBranches)