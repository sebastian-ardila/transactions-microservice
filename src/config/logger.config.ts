import { Params } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Pino logger configuration for nestjs-pino.
 *
 * - Development: uses pino-pretty for human-readable colored output.
 * - Production: outputs structured JSON (no transport overhead).
 *
 * Serializers limit logged request/response data to method, url, and statusCode
 * to avoid leaking sensitive headers or body content.
 */
export const loggerConfig: Params = {
  pinoHttp: {
    transport: !isProduction
      ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
      : undefined,
    autoLogging: true,
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  },
};
