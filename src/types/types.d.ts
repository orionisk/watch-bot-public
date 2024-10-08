import {
  insertUserPeriodChangesSchema,
  insertUsersExchangesSchema,
  insertUsersSchema
} from '@/db/zod';
import { pro as ccxt, Exchange as CcxtExchange } from 'ccxt';
import { z } from 'zod';

export type Exchange = CcxtExchange;

export type ExchangeName = keyof typeof ccxt;
export type ExchangeConfiguration = {
  apiKey?: string;
  secret?: string;
  [key: string]: any;
};

export type ExchangeConfigurations = Partial<{
  [K in ExchangeName]: ExchangeConfiguration;
}>;

export type ExchangeInstance = InstanceType<(typeof ccxt)[ExchangeName]>;

type ExchangeData = {
  last: number;
  lastTime: string;
  min: number;
  minTime: string;
  changePercent: number;
};

export type PriceChangeData = {
  symbol: string;
  data: Record<string, ExchangeData>;
};

type ExchangeDataDual = {
  last: number;
  lastTime: string;
  prev: number;
  prevTime: string;
  changePercent: number;
};

export type PriceChangeDataDual = {
  symbol: string;
  data: Record<string, ExchangeDataDual>;
};

export type User = z.infer<typeof insertUsersSchema>;

interface UserGroup {
  period: number;
  users: UserWithExchanges[];
}

export type UserWithExchanges = User & {
  userExchanges: z.infer<typeof insertUsersExchangesSchema>[];
  userPeriodChanges: z.infer<typeof insertUserPeriodChangesSchema>[];
};

export type Cooldowns = {
  [id: number]: {
    [period: string]: {
      [change: number]: {
        [symbol: string]: {
          [exchangeName: string]: {
            cdEndTimestamp: number;
            last: number;
            prev;
          };
        };
      };
    };
  };
};

export type ParsePriceData = {
  exchange: string;
  symbol?: string;
  price?: number;
  timestamp?: string;
};
