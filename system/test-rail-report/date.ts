import * as dayjs from 'dayjs';
import * as advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

function getDateInterface(startData: string = dayjs().format('MM/DD/YYYY')) {
  const startDate = dayjs(startData, 'MM/DD/YYYY');

  function getMonthRangeInUnixBy(monthFromDate) {
    const end = startDate.subtract(monthFromDate, 'M');
    const start = end.subtract(monthFromDate + 1, 'M');

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
