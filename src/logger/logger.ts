import { config } from 'dotenv';
import pino from 'pino';

const env = process.env.NODE_ENV || 'development';

const configMap: any = {
  development: '.env.development',
  production: '.env.prod',
  beta: '.env.prod.beta'
};

config({ path: configMap[env] });

const isDevelopment = env === 'development';

const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  base: undefined,
  mixin: isDevelopment
    ? () => ({
        get caller() {
          const stack = new Error().stack;
          if (!stack) return undefined;

          const projectRoot = process.cwd();
          const lines = stack.split('\n');

          for (const line of lines) {
            if (line.includes('node_modules') || line.includes('logger.ts'))
              continue;

            const match = line.match(/\((.*):(\d+):(\d+)\)$/);
            if (match) {
              const [, fullPath, lineNumber, columnNumber] = match;
              if (fullPath.startsWith(projectRoot)) {
                const relativePath = fullPath.slice(projectRoot.length + 1);
                return `${relativePath}:${lineNumber}:${columnNumber}`;
              }
            }
          }

          return undefined;
        }
      })
    : undefined
});

export { logger };
