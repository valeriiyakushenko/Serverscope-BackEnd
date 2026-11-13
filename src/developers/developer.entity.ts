import {Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn} from 'typeorm';
import { ApiKey } from './api-key.entity';

@Entity('developers')
export class Developer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    email: string;

    @Column()
    password_hash: string;

    @OneToMany(() => ApiKey, (apiKey) => apiKey.developer)
    apiKeys: ApiKey[];

    @CreateDateColumn()
    created_at: Date;
}