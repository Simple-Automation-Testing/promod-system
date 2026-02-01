/* eslint-disable sonarjs/cognitive-complexity */
import { camelize } from 'sat-utils';
import { config } from '../../config/config';
import { getAllBaseActions, getInstanceInteractionFields } from '../utils';
import { getFragmentTypes } from '../create.type';
import { isCollectionInstance } from '../get.base';
import { checkThatInstanceHasActionItems } from '../check.that.action.exists';

const { baseLibraryDescription = {}, collectionDescription, resultActionsMap } = config.get();

interface FragmentTypeInfo {
  fragmentName: string;
  fragmentId: string;
  types: Map<string, { entryType: string; resultType: string }>;
}

/**
 * Collects only top-level fragments from a page instance (direct children, not nested)
 */
function collectFragments(instance: object, fragments: Map<string, object> = new Map()): Map<string, object> {
  const interactionFields = getInstanceInteractionFields(instance);

  for (const field of interactionFields) {
    const childInstance = instance[field];
    const childConstructorName = childInstance?.constructor?.name ?? '';

    if (childConstructorName.includes(baseLibraryDescription.fragmentId)) {
      const fragmentId = childInstance[baseLibraryDescription.entityId];
      if (fragmentId && !fragments.has(fragmentId)) {
        fragments.set(fragmentId, childInstance);
        // Don't recurse - only collect top-level fragments
      }
    } else if (isCollectionInstance(childInstance)) {
      // Handle collections with fragment items - still check direct children
      const collectionFields = getInstanceInteractionFields(childInstance);
      for (const collField of collectionFields) {
        const collChild = childInstance[collField];
        const collChildName = collChild?.constructor?.name ?? '';
        if (collChildName.includes(baseLibraryDescription.fragmentId)) {
          const fragId = collChild[baseLibraryDescription.entityId];
          if (fragId && !fragments.has(fragId)) {
            fragments.set(fragId, collChild);
          }
        }
      }
    }
  }

  return fragments;
}

/**
 * Generates types for a single fragment across all actions
 */
function generateFragmentTypes(fragmentId: string, instance: object): FragmentTypeInfo {
  const actions = getAllBaseActions().filter(action => !Object.values(collectionDescription).includes(action));
  const types = new Map<string, { entryType: string; resultType: string }>();

  for (const action of actions) {
    if (!checkThatInstanceHasActionItems(instance, action)) {
      continue;
    }

    const entryType = getFragmentTypes(instance, action, 'entryType');
    const resultType = resultActionsMap[action] === 'void' ? 'void' : getFragmentTypes(instance, action, 'resultType');

    if (entryType && entryType !== 'unknown') {
      types.set(action, { entryType, resultType });
    }
  }

  return {
    fragmentName: camelize(fragmentId),
    fragmentId,
    types,
  };
}

/**
 * Generates fragment type declarations for a page
 */
function generateFragmentTypeDeclarations(pageInstance: object): {
  declarations: string;
  fragmentTypes: Map<string, FragmentTypeInfo>;
} {
  const fragments = collectFragments(pageInstance);
  const fragmentTypes = new Map<string, FragmentTypeInfo>();
  const declarations: string[] = [];

  Array.from(fragments.entries()).forEach(([fragmentId, instance]) => {
    const typeInfo = generateFragmentTypes(fragmentId, instance);
    fragmentTypes.set(fragmentId, typeInfo);

    // Generate type definitions for this fragment (no interface wrapper to save space)
    Array.from(typeInfo.types.entries()).forEach(([action, { entryType, resultType }]) => {
      const entryTypeName = `T${typeInfo.fragmentName}${camelize(action)}Entry`;
      const resultTypeName = `T${typeInfo.fragmentName}${camelize(action)}Result`;

      // Add standalone type aliases for direct use by functions
      declarations.push(`type ${entryTypeName} = ${entryType};`);
      if (resultType !== 'void') {
        declarations.push(`type ${resultTypeName} = ${resultType};`);
      }
    });
  });

  return {
    declarations: declarations.join('\n'),
    fragmentTypes,
  };
}

/**
 * Gets the fragment type reference for a given fragment and action
 */
function getFragmentTypeReference(fragmentId: string, action: string, typeKind: 'Entry' | 'Result'): string {
  const fragmentName = camelize(fragmentId);
  const actionName = camelize(action);
  return `T${fragmentName}${actionName}${typeKind}`;
}

export {
  collectFragments,
  generateFragmentTypes,
  generateFragmentTypeDeclarations,
  getFragmentTypeReference,
  FragmentTypeInfo,
};
