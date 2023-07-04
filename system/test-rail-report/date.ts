import * as dayjs from 'dayjs';
import * as advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

function sortMonthes(monthes: string[]) {
  return monthes.sort((firstMonth, secondMonth) => {
    const first = +dayjs(firstMonth, 'YYYY MMMM').format('X');
    const second = +dayjs(secondMonth, 'YYYY MMMM').format('X');
    if (first > second) {
      return 1;
    }
    if (first < second) {
      return -1;
    }
    return 0;
  });
}

function getDateInterface(startData: string = dayjs().format('MM/DD/YYYY')) {
  const startDate = dayjs(startData, 'MM/DD/YYYY').endOf('month');

  function getMonthRangeInUnixBy(monthFromDate) {
    const end = startDate.subtract(monthFromDate, 'M');
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

export { getDateInterface, sortMonthes };
