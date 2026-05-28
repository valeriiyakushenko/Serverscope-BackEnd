import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from './servers.entity';
import { QueryServersDto, QueryServersMapsDto, ServerChartQueryDto } from './dto/query-servers.dto';
import { ServersListResponseDto, ServerMapDto, ServerDetailDto, ServerChartResponseDto } from './dto/server-response.dto';

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
      ip,
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

    if (ip !== undefined) {
      qb.andWhere('server.ip = :ip', { ip });
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

  async findOne(id: number): Promise<ServerDetailDto> {
    const server = await this.serverRepository
      .createQueryBuilder('server')
      .select([
        'server.id',
        'server.ip',
        'server.queryPort',
        'server.gamePort',
        'server.name',
        'server.appid',
        'server.version',
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
        'server.createdAt',
        'server.updatedAt',
        'server.lastSeenAt',
      ])
      .where('server.id = :id', { id })
      .getOne();

    if (!server) {
      throw new NotFoundException(`Server with id ${id} not found`);
    }

    return server as ServerDetailDto;
  }

  async findChart(id: number, query: ServerChartQueryDto): Promise<ServerChartResponseDto> {
    const exists = await this.serverRepository.existsBy({ id });
    if (!exists) {
      throw new NotFoundException(`Server with id ${id} not found`);
    }

    const { period } = query;

    let sql: string;

    if (period === '24h') {
      sql = `
        WITH slots AS (
          SELECT generate_series(
            date_trunc('minute', NOW() - INTERVAL '24 hours') - (EXTRACT(MINUTE FROM NOW() - INTERVAL '24 hours')::int % 15) * INTERVAL '1 minute',
            date_trunc('minute', NOW()) - (EXTRACT(MINUTE FROM NOW())::int % 15) * INTERVAL '1 minute',
            INTERVAL '15 minutes'
          ) AS slot
        )
        SELECT
          TO_CHAR(slots.slot AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS time,
          COALESCE(AVG(r.players)::int, 0) AS players
        FROM slots
        LEFT JOIN online_records r
          ON date_trunc('minute', r.recorded_at) - (EXTRACT(MINUTE FROM r.recorded_at)::int % 15) * INTERVAL '1 minute' = slots.slot
          AND r.server_id = $1
        GROUP BY slots.slot
        ORDER BY slots.slot ASC
      `;
    } else {
      const intervalMap: Record<string, string> = {
        '3d': '3 days',
        '7d': '7 days',
        '30d': '30 days',
      };
      const interval = intervalMap[period];
      sql = `
        WITH slots AS (
          SELECT generate_series(
            date_trunc('hour', NOW() - INTERVAL '${interval}'),
            date_trunc('hour', NOW()),
            INTERVAL '1 hour'
          ) AS slot
        )
        SELECT
          TO_CHAR(slots.slot AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS time,
          COALESCE(AVG(r.players)::int, 0) AS players
        FROM slots
        LEFT JOIN online_records r
          ON date_trunc('hour', r.recorded_at) = slots.slot
          AND r.server_id = $1
        GROUP BY slots.slot
        ORDER BY slots.slot ASC
      `;
    }

    const rows = await this.serverRepository.query<{ time: string; players: number }[]>(sql, [id]);

    return { points: rows };
  }
}
