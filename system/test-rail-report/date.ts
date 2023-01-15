import * as dayjs from 'dayjs';
import * as advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

function getDateInterface(startData: string = '01/01/2021') {
  const startDate = dayjs(startData, 'MM/DD/YYYY');

  function getMonthRangeInUnixBy(addMonth) {
    const end = startDate.add(addMonth, 'M');
    const start = end.subtract(1, 'M');

    const startUnix = +start.format('X');
    const endUnix = +end.format('X');
    const id = end.format('YYYY MMMM');

    return {
      startUnix,
      endUnix,
      id,
    };
  }

  return {
    getMonthRangeInUnixBy,
  };
}

export { getDateInterface };
