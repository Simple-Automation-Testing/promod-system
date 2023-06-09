/* eslint-disable no-console */
function createType(itemObject: Array<{ [k: string]: { [k: string]: string } }> | { [k: string]: string }, action) {
  if (itemObject[action]) {
    return `${itemObject[action]}`;
  }

  const generatedTypeString = (itemObject as Array<{ [k: string]: { [k: string]: string } }>)
    .filter(item => item[Object.keys(item)[0]][action])
    .reduce((typeString, fieldDescriptor, index, initialArr) => {
      const field = Object.keys(fieldDescriptor)[0];

      return fieldDescriptor[field][action]
        ? typeString +
            (index === initialArr.length - 1
              ? `\n ${field}?: ${fieldDescriptor[field][action]}\n}`
              : `\n ${field}?: ${fieldDescriptor[field][action]}`)
        : typeString;
    }, '{');

  if (generatedTypeString === '{') {
    // TODO need to find a solution to make
    console.log('Issue, type generation does not handle properly ');

    return 'unknown';
  }

  return generatedTypeString;
}

export { createType };
