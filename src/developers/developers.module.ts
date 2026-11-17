import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Developer } from './developer.entity';
import { ApiKey } from './api-key.entity';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Developer, ApiKey])],
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard, TypeOrmModule],
})
export class DevelopersModule {}