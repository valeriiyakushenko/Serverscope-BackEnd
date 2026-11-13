import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Developer } from './developer.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key_hash: string;

  @Column({ default: 'free' })
  tariff: string;

  @Column('simple-array', { nullable: true })
  permissions: string[];

  @Column({ default: false })
  is_revoked: boolean;

  @ManyToOne(() => Developer, (developer) => developer.apiKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'developer_id' })
  developer: Developer;

  @CreateDateColumn()
  created_at: Date;
}