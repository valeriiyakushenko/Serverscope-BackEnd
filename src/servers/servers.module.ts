import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './servers.entity';
import { OnlineRecord } from './online-record.entity';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Server, OnlineRecord])],
  controllers: [ServersController],
  providers: [ServersService],
})
export class ServersModule {}
