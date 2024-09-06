import { PriceChangeData, PriceChangeDataDual } from '@/types/types';
import { bot } from './bot';
import { insertUsersSchema } from '@/db/zod';
import { z } from 'zod';
import { logger } from '@/logger/logger';
import { formatMessage } from './format';

const MAX_RETRIES = 3; // Maximum number of retry attempts
const RETRY_DELAY = 2000; // Delay between retries in milliseconds
const MAX_PAIRS_PER_MESSAGE = 15; // Maximum number of pairs per message

const chunkArray = <T>(array: T[], chunkSize: number): T[][] =>
  Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, index) =>
    array.slice(index * chunkSize, index * chunkSize + chunkSize)
  );

const sendMessage = async (id: number, message: string): Promise<void> => {
  let attempts = 0;
  let success = false;

  while (attempts < MAX_RETRIES && !success) {
    try {
      await bot.api.sendMessage(id, message, {
        parse_mode: 'MarkdownV2',
        link_preview_options: {
          is_disabled: true
        }
      });
      success = true; // Message sent successfully
    } catch (error) {
      attempts++;
      logger.error(
        `Error sending message (attempt ${attempts}): ${error}, message: ${message}`
      );

      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        logger.error('Max retries reached. Failed to send message.');
      }
    }
  }
};

export const sendPriceChangeNotification = async (
  user: z.infer<typeof insertUsersSchema>,
  data: PriceChangeDataDual[]
): Promise<void> => {
  const { isAdmin, id } = user;
  const chunks: PriceChangeDataDual[][] = chunkArray(
    data,
    MAX_PAIRS_PER_MESSAGE
  );

  for (const chunk of chunks) {
    const message = chunk
      .map(res => formatMessage(res, isAdmin))
      .filter(Boolean)
      .join('\n');

    if (message) {
      await sendMessage(id, message);
    }
  }
};
