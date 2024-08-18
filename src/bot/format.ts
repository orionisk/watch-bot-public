import { PriceChangeData } from '@/types/types';

const exchangeMap: Record<
  string,
  {
    emoji: string;
    base: string;
    extra: string;
    convert: (symbol: string) => string;
  }
> = {
  Binance: {
    emoji: '🟠',
    base: 'binance.com',
    extra: 'futures',
    convert: symbol => symbol
  },
  Bybit: {
    emoji: '⚫️',
    base: 'bybit.com',
    extra: 'trade/usdt',
    convert: symbol => symbol
  },
  OKX: {
    emoji: '⚪️',
    base: 'okx.com',
    extra: `trade-swap`,
    convert: symbol => {
      const regex = /([A-Z]+)(USDT)/;
      const matches = symbol.match(regex);
      return matches && matches.length === 3
        ? `${matches[1].toLowerCase()}-${matches[2].toLowerCase()}-swap`
        : symbol;
    }
  }
};

const getLightningEmoji = (changePercent: number): string => {
  const thresholds = [20, 10, 5];
  const emojis = ['⚡⚡⚡', '⚡⚡', '⚡'];

  for (let i = 0; i < thresholds.length; i++) {
    if (changePercent >= thresholds[i]) {
      return emojis[i];
    }
  }

  return '';
};

const getExchangeLink = (exchange: string, symbol: string): string => {
  const data = exchangeMap[exchange];
  if (!data) return '';
  const { base, extra, convert } = data;
  return `https://www.${base}/${extra}/${convert(symbol)}`;
};

const getExchangeEmoji = (exchange: string): string => {
  const data = exchangeMap[exchange];
  if (!data) return '';
  return exchangeMap[exchange].emoji;
};

const escapeString = (str: number | string): string =>
  str.toString().replace(/[.-]/g, '\\$&');

export const formatMessage = (
  res: PriceChangeData,
  isAdmin = false
): string => {
  const exchangeMessages = Object.entries(res.data)
    .map(([exchange, exchangeData]) => {
      if (!exchangeData) return '';

      const { changePercent, prices } = exchangeData;
      const [prev, last] = prices;
      const prevPrice = escapeString(prev.price);
      const lastPrice = escapeString(last.price);
      const priceChange = escapeString(changePercent.toFixed(2));

      const isDelayed =
        new Date(`${last.timestamp}Z`).getTime() + 16000 <
        new Date(`${last.created_at}Z`).getTime();

      if (isDelayed && !isAdmin) return '';

      const prevPriceTime = new Date(prev.timestamp).toLocaleTimeString(
        'de-DE'
      );
      const latestPriceTime = new Date(last.timestamp).toLocaleTimeString(
        'de-DE'
      );
      const lightningEmoji = getLightningEmoji(changePercent);

      const exchangeLink = getExchangeLink(exchange, res.symbol);
      const exchangeEmoji = getExchangeEmoji(exchange);

      const debugDate = isAdmin
        ? new Date(last.created_at).toLocaleTimeString('de-DE')
        : '';
      const delayedMessage = isDelayed ? ` \\(delayed\\)` : '';
      const adminData = isAdmin
        ? `\\(${debugDate}, ${new Date().toLocaleTimeString('de-DE', {
            timeZone: 'UTC'
          })}\\)`
        : '';

      return `
${lightningEmoji}
${prevPriceTime} \\- ${latestPriceTime} ${adminData}${delayedMessage}
${exchangeEmoji} [${exchange}](${exchangeLink}) \\- \`${res.symbol}\`
Change: ${priceChange}% \\($${prevPrice} \\- $${lastPrice}\\);`;
    })
    .filter(Boolean)
    .join('\n');

  return exchangeMessages;
};
