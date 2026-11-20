import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Developer } from './developer.entity';
import { LoginDeveloperDto, RegisterDeveloperDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Developer)
    private readonly developerRepository: Repository<Developer>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDeveloperDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.developerRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Developer with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const developer = this.developerRepository.create({
      email: normalizedEmail,
      password_hash: passwordHash,
    });

    const saved = await this.developerRepository.save(developer);

    return {
      id: saved.id,
      email: saved.email,
      createdAt: saved.created_at,
    };
  }

  async login(dto: LoginDeveloperDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const developer = await this.developerRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!developer) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(
      developer.password_hash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: developer.id, email: developer.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }
}