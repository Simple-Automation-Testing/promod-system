import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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
  // @ts-ignore
  return process.env.PROMOD_S_RECALL_AFTER_EACH === '1' || process.env.PROMOD_S_RECALL_AFTER_EACH === 1;
}

export { getArgumentTags, shouldRecallAfterEachOnFail };
