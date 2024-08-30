import {
  insertUserPeriodChangesSchema,
  insertUsersExchangesSchema,
  insertUsersSchema
} from '@/db/schema/zod';
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

export type User = z.infer<typeof insertUsersSchema>;

interface UserGroup {
  period: number;
  change: number;
  users: UserWithExchanges[];
}

export type UserWithExchanges = User & {
  userExchanges: z.infer<typeof insertUsersExchangesSchema>[];
  userPeriodChanges: z.infer<typeof insertUserPeriodChangesSchema>[];
};

export type Cooldowns = {
  [id: number]: {
    [periodChange: string]: {
      [symbol: string]: {
        [exchangeName: string]: {
          cdEndTimestamp: number;
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
