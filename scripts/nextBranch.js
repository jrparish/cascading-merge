const { execSync } = require('child_process');
const axios = require('axios');

const isFirstBranchNewer = require('../utils/isFirstBranchNewer');

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

console.debug('currentBranch', currentBranch);

if (currentBranch === 'develop' || !currentBranch.startsWith('release/')) {
  console.debug('Clean exit');
  process.exit();
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

// First create a new branch off our current branch
const prBranchName = `feature/merge-conflict-${tokenizedCurrentVersion.version}-to-${tokenizedNextVersion ? tokenizedNextVersion.version : 'develop'}`;
execSync(`git checkout -b ${prBranchName}`);

// Next checkout our target next branch
execSync(`git checkout --track origin/${nextBranch}`);

let hasConflict = false;
let requiresPr = false;

try {
  console.debug('\n=== Starting Merge ===\n');
  execSync(`git merge ${currentBranch}`, { stdio: 'inherit' });
  execSync(`git push origin ${nextBranch}`);
} catch (e) {
  hasConflict = true;
  requiresPr = true;
}

if (hasConflict) {
  console.debug('\n=== Attempting to resolve conflicts ===\n');
  try {
    const targetFileMatches = ['package.json', 'sonar-project.properties'];
    const conflictBuffer = execSync(`git diff --name-only --diff-filter=U`);
    const conflictFiles = conflictBuffer.toString().trim().split('\n');
    conflictFiles
      .filter(filePath => targetFileMatches.some(targetMatch => filePath.endsWith(targetMatch)))
      .forEach(filePath => {
        const sourceFileName = filePath;
        const tmpFileName = `${filePath}.tmp`;
        execSync(`mv ${sourceFileName} ${tmpFileName}`);
        execSync(`node ./utils/resolveVersionConflict ${tmpFileName} true`, { stdio: 'inherit' })
        execSync(`mv ${tmpFileName} ${sourceFileName}`);
        execSync(`git add ${sourceFileName}`, { stdio: 'inherit' })
      });
    const conflicts = execSync('git diff --check', { stdio: 'inherit' })
    if (conflicts) {
      throw new Error('There are still conflicts remaining.');
    }
    execSync(`git commit -m "Merge branch '${currentBranch}' into ${nextBranch}"`);
    execSync(`git push origin ${nextBranch}`);
    requiresPr = false;
  } catch (e) {
    console.error(e);
    requiresPr = true;
  }
}

if (requiresPr) {
  console.debug('\n=== PR is required ===\n');
  execSync(`git push origin ${prBranchName}`);
  axios.post('https://api.github.com/repos/jrparish/cascading-merge/pulls', {
    title: `chore: merge '${currentBranch}' into ${nextBranch}`,
    head: prBranchName,
    base: nextBranch
  }, {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`
    }
  })
}

console.debug('\n=== Cascade complete ===\n');
