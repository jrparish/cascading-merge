/**
 * This algorithm is based on Bitbucket's Branch ordering algorithm
 * https://confluence.atlassian.com/bitbucketserver/automatic-branch-merging-776639993.html#Automaticbranchmerging-ordering
 *
 * Only branches that begin with the prefix 'release/' are examined
 * 
 * Branch names are split into tokens using any of these characters: underscore '_', hyphen '-',
 *  plus '+', or period '.'
 * 
 * Branches are ordered by number, if a given token is numeric. When comparing a numeric token
 *  with an ASCII token, the numeric is ranked higher (i.e. is considered as being a newer
 *  version)
 * 
 * If both tokens are non-numeric, a simple ASCII comparison is used
 */
export default function isFirstBranchNewer(branchA, branchB) {
  for (const [index, branchAToken] of branchA.tokens.entries()) {
    const branchBToken = branchB.tokens[index];

    /**
     * Longer version always come after shorter versions if they are
     * equivalent up to that point.
     *
     * Example: 5.6 comes before 5.6.1
     */
    if (!branchBToken) {
      return true;
    }

    if (isNaN(branchAToken)) {
      if (isNaN(branchBToken)) {
        /**
         * If both tokens are non-numeric perform string comparison
         */
        if (branchBToken < branchAToken) {
          // 5.6-alpha comes before 5.6-beta
          return true;
        } else if (branchAToken === branchBToken) {
          // Equal, keep checking
          continue;
        }

        return false;
      } else {
        /**
         * Numeric tokens are newer than non-numeric tokens
         *
         * Example: 6.1-SNAPSHOT is older than 6.1.0
         */
        return false;
      }
    } else {
      /**
       * Numeric tokens are newer than non-numeric tokens
       *
       * Example: 6.1-SNAPSHOT comes before 6.1.0
       */
      if (isNaN(branchBToken)) {
        return true;
      } else {
        const branchAInt = parseInt(branchAToken);
        const branchBInt = parseInt(branchBToken);

        /**
         * Perform numeric comparison
         */
        if (branchBInt < branchAInt) {
          // Example: 5 comes before 6
          return true;
        } else if (branchAInt === branchBInt) {
          // Equal, keep checking
          continue;
        }

        return false;
      }
    }
  }

  /**
   * Reaching this point means the current version had all of the branch
   * version's tokens and then some, meaning the current version is
   * newer (later) than the branch version.
   */
  return false;
}
