// @ts-check
import * as fs from 'fs';
import { getDirFilesList } from 'sat-utils';

type TvalidateActor = {
  targetFolder: string;
  actorActionType: string;
  actorActionGetters: string;
  matchExportGetActions?: RegExp;
  matchExportType?: RegExp;
};
function validateTypesActor({
  targetFolder,
  actorActionType,
  actorActionGetters,
  matchExportGetActions = /(?<=export {).*(?= )/gim,
  matchExportType = /(?<=export type).*(?==)/gim,
}: TvalidateActor) {
  const actorTypesContent = fs.readFileSync(actorActionType, 'utf8');
  const actorActionGetterContent = fs.readFileSync(actorActionGetters, 'utf8');

  const pageActionTypes = getDirFilesList(targetFolder)
    /**
     * @info page.actions.types.d.ts is default file name for generated action types
     */
    .filter(file => file.endsWith('page.actions.types.d.ts'))
    .map(file => {
      const [pageActionType] = fs.readFileSync(file, 'utf8').match(matchExportType) || [''];

      return pageActionType.trim();
    })
    .filter(Boolean);

  const pageActionGetters = getDirFilesList(targetFolder)
    /**
     * @info page.get.actions.ts is default file name for generated action getters
     */
    .filter(file => file.endsWith('page.get.actions.ts'))
    .map(file => {
      const [pageActionGetter] = fs.readFileSync(file, 'utf8').match(matchExportGetActions) || [''];

      return pageActionGetter.trim();
    })
    .filter(Boolean);

  if (pageActionTypes.length === 0) {
    throw new Error('No page action types found');
  }

  if (pageActionGetters.length === 0) {
    throw new Error('No page action getters found');
  }

  const notImportedTypes = pageActionTypes.filter(typeItem => !actorTypesContent.includes(typeItem));
  const notImportedActionGetters = pageActionGetters.filter(typeItem => !actorActionGetterContent.includes(typeItem));

  if (notImportedTypes.length) {
    throw new Error(`The following types are not imported in ${actorActionType}: ${notImportedTypes.join(', ')}`);
  }

  if (notImportedActionGetters.length) {
    throw new Error(
      `The following page action getters are not imported in ${actorActionGetters}: ${notImportedActionGetters.join(', ')}`,
    );
  }
}

export { validateTypesActor };
