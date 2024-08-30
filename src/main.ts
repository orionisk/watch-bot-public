import { bot } from '@/bot/bot';
import { pro as ccxt } from 'ccxt';
import { watchExchanges } from '@/features/exchanges/exchange';
import { logger } from '@/logger/logger';
import { watchPumps } from './features/pump/watch-pumps';
import { startAtNextSecond } from './common/utils';

process.on('uncaughtException', err => {
  // console.log(`Uncaught Exception: ${err.message}`)
  logger.error('Uncaught Exception: ' + err.message);
  process.exit(1);
});

const baseConfig = {
  options: { defaultType: 'swap' }
};

const binance = new ccxt.binance(baseConfig);
const bybit = new ccxt.bybit(baseConfig);
const okx = new ccxt.okx(baseConfig);

startAtNextSecond(() => {
  watchExchanges(binance, bybit, okx);
  watchPumps();
});

console.log('done');

bot.start();
