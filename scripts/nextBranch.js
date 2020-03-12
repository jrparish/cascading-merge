const { execSync } = require('child_process');
const isFirstBranchNewer = require('../utils/isFirstBranchNewer');

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

console.debug('currentBranch', currentBranch);

if (currentBranch === 'develop' || !currentBranch.startsWith('release/')) {
  console.debug('Clean exit');
  return;
}

const currentVersion = currentBranch.slice(currentBranch.indexOf('/') + 1).trim();

const allBranches = execSync(`git branch -r`)
  .toString()
  .split(/\r?\n/);

const allOtherReleaseBranchVersions = allBranches
  .map(branch => branch.slice(branch.indexOf('/') + 1).trim()) // Trim the origin/ prefix
  .filter(branch => branch.startsWith('release/')) // Only include branches that start with release/
  .map(branch => branch.slice(branch.indexOf('/') + 1)) // Trim the release/ prefix
  .filter(version => version !== currentVersion); // Filter out the current branch version

const allOtherTokenizedReleaseBranchVersions = allOtherReleaseBranchVersions.map(version => ({
  version,
  tokens: version.split(/[_\-+.]+/)
}));

const tokenizedCurrentVersion = {
  version: currentVersion,
  tokens: currentVersion.split(/[_\-+.]+/)
};

const [tokenizedNextVersion] = allOtherTokenizedReleaseBranchVersions
  .filter(version => isFirstBranchNewer(version, tokenizedCurrentVersion))
  .sort(isFirstBranchNewer);

let nextBranch = 'develop';
if (tokenizedNextVersion) {
  nextBranch = `release/${tokenizedNextVersion.version}`
}

console.debug('nextBranch', nextBranch);

execSync(`git checkout --track origin/${nextBranch}`);
execSync(`git merge ${currentBranch}`, { stdio: 'inherit' });
execSync(`git push origin ${nextBranch}`);

console.debug('Cascade complete');
