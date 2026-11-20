import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Developer } from './developer.entity';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ApiKey } from './api-key.entity';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard, REDIS_CLIENT } from './guards/rate-limit.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Developer, ApiKey])],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get<string>('REDIS_HOST', '127.0.0.1'),
          port: config.get<number>('REDIS_PORT', 6379),
        });
      },
    },
    ApiKeyGuard,
    RateLimitGuard,
  ],
  exports: [ApiKeyGuard, RateLimitGuard, REDIS_CLIENT, TypeOrmModule],
})
export class DevelopersModule {}