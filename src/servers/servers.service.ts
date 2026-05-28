import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from './servers.entity';
import { QueryServersDto, QueryServersMapsDto } from './dto/query-servers.dto';
import { ServersListResponseDto, ServerMapDto } from './dto/server-response.dto';

const SERVER_SELECT_FIELDS = [
  'server.id',
  'server.ip',
  'server.queryPort',
  'server.gamePort',
  'server.name',
  'server.appid',
  'server.map',
  'server.isSecure',
  'server.isDedicated',
  'server.os',
  'server.region',
  'server.maxPlayers',
  'server.players',
  'server.rank',
  'server.hourlyOnline',
  'server.isOnline',
  'server.version',
  'server.lastSeenAt',
  'server.updatedAt',
];

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async findAll(query: QueryServersDto): Promise<ServersListResponseDto> {
    const {
      appid,
      page = 1,
      limit = 25,
      search,
      sortBy = 'rank',
      sortOrder = 'asc',
      map,
      isSecure,
      isOnline,
    } = query;

    const qb = this.serverRepository
      .createQueryBuilder('server')
      .select(SERVER_SELECT_FIELDS)
      .where('server.appid = :appid', { appid });

    if (search) {
      qb.andWhere('server.name ILIKE :search', { search: `%${search}%` });
    }

    if (map !== undefined) {
      qb.andWhere('server.map = :map', { map });
    }

    if (isSecure !== undefined) {
      qb.andWhere('server.isSecure = :isSecure', { isSecure });
    }

    if (isOnline !== undefined) {
      qb.andWhere('server.isOnline = :isOnline', { isOnline });
    }

    if (sortBy === 'rank') {
      qb.orderBy('CASE WHEN server.rank = 0 THEN 1 ELSE 0 END', 'ASC');
      qb.addOrderBy('server.rank', sortOrder.toUpperCase() as 'ASC' | 'DESC');
    } else {
      qb.orderBy(`server.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMaps(query: QueryServersMapsDto): Promise<ServerMapDto[]> {
    const { appid, minServers = 100 } = query;

    return this.serverRepository.query<ServerMapDto[]>(
      `SELECT map, COUNT(*)::int AS "serverCount"
       FROM servers
       WHERE appid = $1
       GROUP BY map
       HAVING COUNT(*) >= $2
       ORDER BY "serverCount" DESC`,
      [appid, minServers],
    );
  }
}
