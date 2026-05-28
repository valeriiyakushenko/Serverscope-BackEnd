import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesModule } from './games/games.module';
import { Game } from './games/games.entity';
import { ServersModule } from './servers/servers.module';
import { Server } from './servers/servers.entity';
import { OnlineRecord } from './servers/online-record.entity';
import { ServerRanking } from './servers/server-ranking.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [Game, Server, OnlineRecord, ServerRanking],
        synchronize: false,
      }),
    }),
    GamesModule,
    ServersModule,
  ],
})
export class AppModule {}
