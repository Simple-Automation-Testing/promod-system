import { logger } from 'sat-utils';

logger.addCustomLevel('promodSystem', 'PROMOD_SYSTEM', 'PROMOD_SYSTEM', 'info', 'BgGreen', 'Underscore');

type TLogger = typeof logger & { promodSystem(...args: any[]): void };

const promodLogger = logger as TLogger;

export { promodLogger };
