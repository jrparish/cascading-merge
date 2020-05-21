/**
This script is a framework for programmatically resolving merge conflicts in a text file.
You should overwrite resolve_conflict() with your own logic.
Assumes the conflicts were generated inline by git, with the diff3 conflictstyle.
    To enable the diff3 conflictstyle, run this command:
        git config --global merge.conflictstyle diff3
Backup your source file before running with "overwrite" mode enabled.
**/

import { argv } from 'yargs';

// The conflict resolution logic goes here.
// Should return the replacement_string, or None if you don't wish to resolve this conflict.
function resolve_conflict(head, base, theirs, entire_conflict) {
  return head
}

const usage = `
  Usage:
  First argument is the path of the source file.
  Second argument, if specified, should be "overwrite" and means that the source file will be overwritten. (Use with care, obviously.)
`

if not (2 <= len(sys.argv) <= 3):
    print usage
    sys.exit('Bad number of args.')

do_overwrite_source_file = False
if len(sys.argv) == 3:
    if sys.argv[2].lower() == 'overwrite':
        do_overwrite_source_file = True
    else:
        sys.exit('Last argument should be "overwrite" if specified.')

source_filename = sys.argv[1]
with open(source_filename) as source_file:
    source_text = source_file.read()

pattern = re.compile(
'''\\n<<<<<<< HEAD'''
'''(?P<head>.*?)'''
'''\\n\|\|\|\|\|\|\| merged common ancestors'''
'''(?P<base>.*?)'''
'''\\n======='''
'''(?P<theirs>.*?)'''
'''\\n>>>>>>> (?P<branch_name>[^\\n]+)''', re.DOTALL)

resolved_count = 0
total_count = 0
replacements = [] // List of (start_index, end_index, replacement_string) tuples.

for (match in re.finditer(pattern, source_text)) {
  head = match.groupdict()['head']
  base = match.groupdict()['base']
  theirs = match.groupdict()['theirs']
  match_string = match.string[match.start() : match.end()]
  replacement_string = resolve_conflict(head, base, theirs, match_string)
  if replacement_string is not None:
  replacements.append((match.start(), match.end(), replacement_string))
  resolved_count += 1
  total_count += 1
  console.log('branch_name:       ', repr(match.groupdict()['branch_name']))
  console.log('head:              ', repr(head))
  console.log('base:              ', repr(base))
  console.log('theirs:            ', repr(theirs))
  console.log('match_string:      ', repr(match_string))
  console.log('replacement_string:', repr(replacement_string))
  console.log('--------------------')
}

// Perform the replacements in reverse, so as not to mess up the indices.
result_text = source_text
replacements.sort(reverse=True)
for (start, end, replacement_string) in replacements:
    result_text = result_text[:start] + replacement_string + result_text[end:]

if (do_overwrite_source_file) {
  console.log('Overwriting file.')
  with open(source_filename, 'w') as source_file:
  source_file.write(result_text)
} else {
  console.log('Dry run (Not overwriting file).')
}

console.log('Resolved %d out of %d conflicts.', resolved_count, total_count);