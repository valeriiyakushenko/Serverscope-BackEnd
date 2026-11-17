import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../developers/guards/api-key.guard';

@ApiTags('v1/servers')
@ApiSecurity('X-API-Key')
@UseGuards(ApiKeyGuard)
@Controller({ version: '1', path: 'servers' })
export class DeveloperServersController {
  
  @Get()
  getServers() {
    return "Список серверів для зовнішніх розробників";
  }
}