import { Logger } from '@ttec-dig-vf/vf-logger';

const logger = new Logger({
  level: process.env.LOGGING_LEVEL?.toLowerCase() || 'debug',
  formatters: {
    level: (label: string) => {
      return { level: label };
    }
  }
});

export default logger;
