// @ts-check
import { isPrimitive, stringifyData, getStringifyReadyData } from 'sat-utils';

const getDefaultMessage = argument => {
  const result = isPrimitive(argument) ? String(argument) : stringifyData(getStringifyReadyData(argument));
  return `With arguments\n'${result}' `;
};

export { getDefaultMessage };
