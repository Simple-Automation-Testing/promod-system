// @ts-ignore -- yargs v18 has no type declarations for helpers subpath
import { hideBin } from 'yargs/helpers';
// @ts-ignore -- yargs v18 has no default export types
import yargs from 'yargs';

const argv = yargs(hideBin(process.argv)).argv;

/**
 * @returns {string[]}
 */
function getArgumentTags(): string[] {
  const tagsArgId = process.env.PROMOD_S_TAGS_ID || 'tags';

  return argv[tagsArgId]?.split(',') || [];
}

/**
 * @returns {boolean}
 */
function shouldRecallAfterEachOnFail() {
  return Boolean(process.env.PROMOD_S_RECALL_AFTER_EACH);
}

export { getArgumentTags, shouldRecallAfterEachOnFail };
