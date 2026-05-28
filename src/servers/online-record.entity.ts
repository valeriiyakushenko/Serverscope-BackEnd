import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Server } from './servers.entity';

@Entity('online_records')
@Index('idx_online_records_server_id_recorded_at', ['serverId', 'recordedAt'], { unique: true })
export class OnlineRecord {
  @PrimaryGeneratedColumn() id: number;

  @Column({ name: 'server_id', type: 'int' }) serverId: number;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @Column({ type: 'int' }) players: number;

  @Column({ name: 'max_players', type: 'int' }) maxPlayers: number;

  @Column({ name: 'recorded_at', type: 'timestamptz' }) recordedAt: Date;
}
