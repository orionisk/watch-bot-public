import { CronJob } from 'cron';
import { checkPriceChange } from './price';
import { logger } from '@/logger/logger';

const job = CronJob.from({
  cronTime: '* * * * * *',
  onTick: async () => {
    try {
      checkPriceChange();
    } catch (error) {
      logger.error('Error in checkPriceChange:', error);
    }
  },
  timeZone: 'UTC'
});

export const watchPumps = () => {
  job.start();
};
