import { createLogger } from 'sat-utils';

const logger = createLogger();

logger.addCustomLevel('promodSystem', 'PROMOD_SYSTEM', 'PROMOD_SYSTEM', 'info', 'BgGreen', 'Underscore');
logger.addCustomLevel(
  'promodSystemGeneration',
  'PROMOD_SYSTEM_GENERATION',
  'PROMOD_SYSTEM_GENERATION',
  'info',
  'BgGreen',
  'Underscore',
);

type TLogger = typeof logger & { promodSystem(...args: any[]): void; promodSystemGeneration(...args: any[]): void };

const promodLogger = logger as TLogger;

export { promodLogger };
