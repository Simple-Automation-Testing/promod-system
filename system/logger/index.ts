import { createLogger } from 'sat-utils';

const promodLogger = createLogger().addCustomLevel(
  'promodSystem',
  'PROMOD_SYSTEM',
  'PROMOD_SYSTEM',
  'info',
  'BgGreen',
  'Underscore',
);

export { promodLogger };
