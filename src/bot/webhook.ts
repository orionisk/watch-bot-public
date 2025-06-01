import { logger } from '@/logger/logger';
import { PriceChangeDataDual } from '@/types/types';
import { MAX_RETRIES, RETRY_DELAY } from './const';

console.log('test');

export const sendWebhookNotification = async (
  webhookUrl: string,
  data: PriceChangeDataDual
): Promise<void> => {
  Object.entries(data.data).forEach(async ([exchangeName, exchangeData]) => {
    const payload = {
      symbol: data.symbol,
      make: exchangeData.changePercent,
      market: exchangeName.toLowerCase()
    };

    let attempts = 0;
    let success = false;

    while (attempts < MAX_RETRIES && !success) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) success = true;
        attempts++;
      } catch (error) {
        attempts++;
        logger.error(
          `Error sending webhook to ${webhookUrl} (attempt ${attempts}) for ${exchangeName}: ${error}, payload: ${JSON.stringify(payload)}`
        );

        if (attempts < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          logger.error(
            `Max retries reached. Failed to send webhook to ${webhookUrl} for ${exchangeName}.`
          );
        }
      }
    }
  });
};
