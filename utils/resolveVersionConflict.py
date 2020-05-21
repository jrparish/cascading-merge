# This script programmatically resolves merge conflicts in a text file.

# The conflict resolution logic goes here.
# Should return the replacement_string, or None if you don't wish to resolve this conflict.
def resolve_conflict(head, theirs, entire_conflict):
    if head.find('"version":') > 0:
        return head
    else:
        return entire_conflict

# ----------------------------------------

import re
import sys

if __name__ == '__main__':

    usage = '''
    Usage:
    First argument is the path of the source file.
    Second argument, if specified, should be "overwrite" and means that the source file will be overwritten. (Use with care)
    '''

    if not (2 <= len(sys.argv) <= 3):
        print (usage)
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
    '''\\n======='''
    '''(?P<theirs>.*?)'''
    '''\\n>>>>>>> (?P<branch_name>[^\\n]+)''', re.DOTALL)

    resolved_count = 0
    total_count = 0
    replacements = [] # List of (start_index, end_index, replacement_string) tuples.

    for match in re.finditer(pattern, source_text):
        head   = match.groupdict()['head']
        theirs = match.groupdict()['theirs']
        match_string = match.string[match.start() : match.end()]
        replacement_string = resolve_conflict(head, theirs, match_string)
        if replacement_string is not None:
            replacements.append((match.start(), match.end(), replacement_string))
            resolved_count += 1
        total_count += 1
        print('branch_name:       ', repr(match.groupdict()['branch_name']))
        print('head:              ', repr(head))
        print('theirs:            ', repr(theirs))
        print('match_string:      ', repr(match_string))
        print('replacement_string:', repr(replacement_string))
        print()
        print('--------------------')
        print()

    # Perform the replacements in reverse, so as not to mess up the indices.
    result_text = source_text
    replacements.sort(reverse=True)
    for (start, end, replacement_string) in replacements:
        result_text = result_text[:start] + replacement_string + result_text[end:]

    if do_overwrite_source_file:
        print('Overwriting file.')
        with open(source_filename, 'w') as source_file:
            source_file.write(result_text)
    else:
        print('Dry run (Not overwriting file).')

    print('Resolved %d out of %d conflicts.' % (resolved_count, total_count))