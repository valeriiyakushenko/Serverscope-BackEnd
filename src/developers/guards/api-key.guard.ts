import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Request } from 'express';
import { ApiKey } from '../api-key.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawHeader = request.headers['x-api-key'];
    const apiKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const keyHash = createHash('sha256').update(apiKey.trim()).digest('hex');

    const keyRecord = await this.apiKeyRepository.findOne({
      where: { key_hash: keyHash },
      relations: {developer: true},
    });

    if (!keyRecord || keyRecord.is_revoked) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    request['apiKey'] = keyRecord;

    return true;
  }
}