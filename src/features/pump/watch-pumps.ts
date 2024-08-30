import { CronJob } from 'cron';
import { staggeredCheckPriceChange } from './price';

const job = CronJob.from({
  cronTime: '* * * * * *',
  onTick: () => {
    staggeredCheckPriceChange(1000);
  },
  timeZone: 'UTC'
});

export const watchPumps = () => {
  job.start();
};
