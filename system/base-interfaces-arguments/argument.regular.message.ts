import { safeJSONstringify } from 'sat-utils';

const getDefaultMessage = argument => {
  return `With arguments ${safeJSONstringify(argument)}`;
};

export { getDefaultMessage };
