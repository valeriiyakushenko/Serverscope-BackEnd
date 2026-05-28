import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'int' })
  appid: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'image_link' })
  image_link: string | null;

  @Column({ type: 'int', default: 0 })
  players: number;

  @Column({ type: 'int', default: 0 })
  servers: number;

  @Column({ type: 'jsonb', default: '[]', name: 'hourly_online' })
  hourly_online: number[];

  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updated_at: Date | null;
}
