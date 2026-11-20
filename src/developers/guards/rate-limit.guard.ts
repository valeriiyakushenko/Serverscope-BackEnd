import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import { ApiKey } from '../api-key.entity';

export const REDIS_CLIENT = 'REDIS_CLIENT';

interface TariffConfig {
  capacity: number;
  refillPerSec: number;
}

const TARIFF_LIMITS: Record<string, TariffConfig> = {
  free: { capacity: 10, refillPerSec: 10 / 60 },
  pro: { capacity: 100, refillPerSec: 100 / 60 },
  enterprise: { capacity: 1000, refillPerSec: 1000 / 60 },
};

const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if tokens == nil or last_refill == nil then
  tokens = capacity
  last_refill = now
else
  local elapsed = math.max(0, now - last_refill)
  tokens = math.min(capacity, tokens + elapsed * refill_rate)
  last_refill = now
end

local allowed = 0
local retry_after = 0

if tokens >= 1 then
  allowed = 1
  tokens = tokens - 1
else
  allowed = 0
  retry_after = math.ceil((1 - tokens) / refill_rate)
end

local ttl = math.ceil(capacity / refill_rate) + 10
redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
redis.call('EXPIRE', key, ttl)

local reset_after = math.ceil((capacity - tokens) / refill_rate)
return { allowed, math.floor(tokens), retry_after, reset_after }
`;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    // Дані ключа сюди вже поклав попередній ApiKeyGuard
    const apiKey = request['apiKey'] as ApiKey | undefined;
    if (!apiKey) {
      return true;
    }

    const config = TARIFF_LIMITS[apiKey.tariff] ?? TARIFF_LIMITS.free;
    const redisKey = `rate_limit:key:${apiKey.id}`;
    const nowInSeconds = Date.now() / 1000;

    const [allowed, remaining, retryAfter, resetAfter] =
      (await this.redis.eval(
        TOKEN_BUCKET_LUA,
        1,
        redisKey,
        config.capacity,
        config.refillPerSec,
        nowInSeconds,
      )) as [number, number, number, number];

    response.setHeader('X-RateLimit-Limit', config.capacity);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetAfter);

    if (allowed === 0) {
      response.setHeader('Retry-After', retryAfter);
      throw new HttpException(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}