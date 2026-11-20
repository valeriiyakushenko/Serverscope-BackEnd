import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis';
import { Developer } from './developer.entity';
import { ApiKey } from './api-key.entity';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard, REDIS_CLIENT } from './guards/rate-limit.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Developer, ApiKey]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev_fallback_secret'),
        signOptions: {
          expiresIn: 60 * 60 * 24 * 7,
        },
      }),
    }),
  ],
  controllers: [AuthController],
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
    AuthService,
    ApiKeyGuard,
    RateLimitGuard,
    JwtAuthGuard,
  ],
  exports: [
    ApiKeyGuard,
    RateLimitGuard,
    JwtAuthGuard,
    JwtModule,
    REDIS_CLIENT,
    TypeOrmModule,
  ],
})
export class DevelopersModule {}