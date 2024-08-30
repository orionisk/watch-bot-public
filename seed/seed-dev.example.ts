import { seed } from './seed-common';

const usersData = [
  {
    id: 123456789,
    name: 'user',
    isAdmin: true
  }
];

const exchangesData = [
  {
    name: 'Binance'
  },
  {
    name: 'Bybit'
  },
  { name: 'OKX' }
];

await seed(usersData, exchangesData);
