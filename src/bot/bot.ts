import { db } from '@/db/drizzle';
import { users } from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { Bot, InlineKeyboard } from 'grammy';
import { logger } from '@/logger/logger';
import { addUser, checkAdmin, getUser } from '@/users/users';

import '@/config/env';

// Create a bot object
const bot = new Bot(process.env.TELEGRAM_TOKEN!);

const checkUserId = async (id: number) => {
  const res = await db.select().from(users).where(eq(users.id, id));
  return res.length > 0;
};

bot.command('id', ctx => {
  const id = ctx?.from?.id ?? '';
  const name = ctx?.from?.username ?? id;
  logger.info(`User ${ctx?.from?.id} sent command /id`);
  ctx.reply(`${name} ${id}`);
});

bot.command('start', async ctx => {
  const [user, error1] = await getUser(ctx.chatId);

  if (!user) return;

  if (error1) {
    return ctx.reply;
  }
});

bot.command('add', async ctx => {
  // check if user is admin
  const [isAdmin, error1] = await checkAdmin(ctx.chatId);

  if (!isAdmin) return;

  if (error1) {
    return ctx.reply('Something went wrong');
  }

  // get id and name from message
  const id = ctx.match.split(' ')[0];
  const name = ctx.match.split(' ')[1] || 'User';

  if (!id) {
    return ctx.reply('Please, send user id and name');
  }

  const payload = { id: parseInt(id), name };

  const [user, error2] = await addUser(payload);

  if (error2) {
    return ctx.reply(error2);
  }

  await ctx.reply(`User ${user?.name} added`);
});

export { bot };
