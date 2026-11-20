import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../developers/guards/api-key.guard';
import { RateLimitGuard } from '../developers/guards/rate-limit.guard';

@ApiTags('v1/servers')
@ApiSecurity('X-API-Key')
@UseGuards(ApiKeyGuard, RateLimitGuard)
@Controller({ version: '1', path: 'servers' })
export class DeveloperServersController {
  
  @Get()
  getServers() {
    return "Список серверів для зовнішніх розробників";
  }
}