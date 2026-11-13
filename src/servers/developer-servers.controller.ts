import { Controller, Get } from '@nestjs/common';

@Controller({ version: '1', path: 'servers' })
export class DeveloperServersController {
  
  @Get()
  getServers() {
    return "Список серверів для зовнішніх розробників";
  }
}