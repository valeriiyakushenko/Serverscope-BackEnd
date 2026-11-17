import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from './servers.entity';
import { OnlineRecord } from './online-record.entity';
import { ServerRanking } from './server-ranking.entity';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import {DeveloperServersController} from "./developer-servers.controller";
import { DevelopersModule } from '../developers/developers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Server, OnlineRecord, ServerRanking]), DevelopersModule],
  controllers: [ServersController, DeveloperServersController],
  providers: [ServersService],
})
export class ServersModule {}
