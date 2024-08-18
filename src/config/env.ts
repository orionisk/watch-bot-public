import { config } from 'dotenv';

const env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  config({ path: '.env.development' });
}

if (process.env.SEED === 'true' && env === 'production') {
  config({ path: '.env.production' });
}
