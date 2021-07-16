// This script programmatically resolves merge conflicts in a text file.

const { readFileSync, writeFileSync } = require('fs');

const [, , file, overwrite] = process.argv;

// The conflict resolution logic goes here.
// Should return the replacementString, or null if you don't wish to resolve this conflict.
function resolveConflict(head) {
  if (!head.includes('"version":') || !head.includes('projectVersion=')) {
    throw new Error("Found non-version related conflict, exiting auto resolution")
  }
  return head;
}

const sourceText = readFileSync(file).toString();

const lend = `(\n|\r\n)`; // Support cross-platform line endings
const pattern = new RegExp(
  `<<<<<<< HEAD${lend}(?<head>.*?)${lend}=======${lend}(?<theirs>.*?)${lend}>>>>>>> (?<branchName>[^${lend}]+)$`,
  'gsm'
);

let resultText;
let resolvedCount = 0;
let totalCount = 0;
const replacements = []; // List of (start_index, end_index, replacement_string) tuples.

/* eslint-disable-next-line no-restricted-syntax */
for (const match of sourceText.matchAll(pattern)) {
  console.log(match[0]);
  const { head, theirs, branchName } = match.groups;
  const [matchString] = match;
  const replacementString = resolveConflict(head, theirs, matchString)
  if (replacementString) {
    replacements.push([match.index, match.index + matchString.length, replacementString])
    resolvedCount += 1
  }
  totalCount += 1
  console.log('branchName:      ', branchName)
  console.log('head:            ', head)
  console.log('theirs:          ', theirs)
  console.log('matchString:     ', matchString)
  console.log('replacementString:', replacementString)
  console.log('--------------------')

  resultText = sourceText.replace(matchString, replacementString);
}

if (replacements.length > 1) {
  throw new Error('Found multiple conflicts, exiting auto resolution');
}

if (overwrite) {
  console.log('Overwriting file.')
  writeFileSync(file, resultText)
} else {
  console.log('Dry run (Not overwriting file).');
  console.log(resultText);
}

console.log('Resolved %d out of %d conflicts.', resolvedCount, totalCount);
