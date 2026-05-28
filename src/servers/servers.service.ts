import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from './servers.entity';
import { ServerRanking } from './server-ranking.entity';
import { QueryServersDto, QueryServersMapsDto, ServerChartQueryDto, ServerHistoryQueryDto, ServerRankHistoryQueryDto } from './dto/query-servers.dto';
import { ServersListResponseDto, ServerMapDto, ServerDetailDto, ServerChartResponseDto, ServerRankChartResponseDto, ServerUptimeChartResponseDto } from './dto/server-response.dto';

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
    @InjectRepository(ServerRanking)
    private readonly rankingRepository: Repository<ServerRanking>,
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

    const serverIds = data.map((s) => s.id);
    const rankingStats = await this.getLatestRankingStats(serverIds);

    const enriched = data.map((s) => ({
      ...s,
      popularity: rankingStats.get(s.id)?.popularity ?? 0,
      stability: rankingStats.get(s.id)?.stability ?? 0,
    }));

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async getLatestRankingStats(
    serverIds: number[],
  ): Promise<Map<number, { popularity: number; stability: number }>> {
    if (!serverIds.length) return new Map();

    const rows = await this.rankingRepository.query<
      { server_id: number; popularity: number; stability: number }[]
    >(
      `SELECT DISTINCT ON (server_id)
         server_id,
         popularity::float AS popularity,
         stability::float  AS stability
       FROM server_rankings
       WHERE server_id = ANY($1)
       ORDER BY server_id, calculated_at DESC`,
      [serverIds],
    );

    return new Map(rows.map((r) => [r.server_id, { popularity: r.popularity, stability: r.stability }]));
  }

  async findMaps(query: QueryServersMapsDto): Promise<ServerMapDto[]> {    const { appid, minServers = 100 } = query;

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

    const rankingStats = await this.getLatestRankingStats([id]);
    const stats = rankingStats.get(id);

    return {
      ...(server as unknown as ServerDetailDto),
      popularity: stats?.popularity ?? 0,
      stability: stats?.stability ?? 0,
    };
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

  async findRankChart(id: number, query: ServerRankHistoryQueryDto): Promise<ServerRankChartResponseDto> {
    const exists = await this.serverRepository.existsBy({ id });
    if (!exists) {
      throw new NotFoundException(`Server with id ${id} not found`);
    }

    const days = parseInt(query.period);
    const sql = `
      WITH period AS (
        SELECT NOW() - INTERVAL '${days} days' AS date_from
      ),
      daily AS (
        SELECT DISTINCT ON (DATE_TRUNC('day', calculated_at))
          DATE_TRUNC('day', calculated_at) AS day,
          rank,
          score,
          uptime_ratio
        FROM server_rankings
        WHERE server_id = $1
          AND calculated_at >= (SELECT date_from FROM period)
        ORDER BY DATE_TRUNC('day', calculated_at), calculated_at DESC
      ),
      slots AS (
        SELECT generate_series(
          DATE_TRUNC('day', (SELECT date_from FROM period)),
          DATE_TRUNC('day', NOW()),
          INTERVAL '1 day'
        ) AS day
      )
      SELECT
        s.day                        AS time,
        COALESCE(d.rank, 0)          AS rank,
        COALESCE(d.score, 0)         AS score,
        COALESCE(d.uptime_ratio, 0)  AS "uptimeRatio"
      FROM slots s
      LEFT JOIN daily d ON d.day = s.day
      ORDER BY s.day ASC
    `;

    const rows = await this.rankingRepository.query<{
      time: Date;
      rank: number;
      score: number;
      uptimeRatio: number;
    }[]>(sql, [id]);

    return {
      points: rows.map((r) => ({
        time: new Date(r.time).toISOString(),
        rank: Number(r.rank),
        score: Number(r.score),
        uptimeRatio: Number(r.uptimeRatio),
      })),
    };
  }

  async findUptimeChart(id: number, query: ServerHistoryQueryDto): Promise<ServerUptimeChartResponseDto> {
    const exists = await this.serverRepository.existsBy({ id });
    if (!exists) {
      throw new NotFoundException(`Server with id ${id} not found`);
    }

    let sql: string;

    if (query.period === '24h') {
      sql = `
        WITH period AS (
          SELECT
            DATE_TRUNC('hour', NOW()) - INTERVAL '23 hours' AS date_from,
            DATE_TRUNC('hour', NOW()) + INTERVAL '1 hour'   AS date_to
        ),
        slots AS (
          SELECT generate_series(
            (SELECT date_from FROM period),
            (SELECT date_to FROM period) - INTERVAL '1 hour',
            INTERVAL '1 hour'
          ) AS hour
        ),
        hourly AS (
          SELECT
            DATE_TRUNC('hour', recorded_at) AS hour,
            LEAST(COUNT(*)::numeric / 4.0, 1.0) AS uptime_ratio
          FROM online_records
          WHERE server_id = $1
            AND recorded_at >= (SELECT date_from FROM period)
            AND recorded_at <  (SELECT date_to FROM period)
          GROUP BY DATE_TRUNC('hour', recorded_at)
        )
        SELECT
          s.hour                             AS time,
          COALESCE(h.uptime_ratio, 0)        AS "uptimeRatio",
          1 - COALESCE(h.uptime_ratio, 0)    AS "downtimeRatio"
        FROM slots s
        LEFT JOIN hourly h ON h.hour = s.hour
        ORDER BY s.hour ASC
      `;
    } else {
      const days = parseInt(query.period);
      sql = `
        WITH period AS (
          SELECT NOW() - INTERVAL '${days} days' AS date_from
        ),
        daily AS (
          SELECT DISTINCT ON (DATE_TRUNC('day', calculated_at))
            DATE_TRUNC('day', calculated_at) AS day,
            uptime_ratio
          FROM server_rankings
          WHERE server_id = $1
            AND calculated_at >= (SELECT date_from FROM period)
          ORDER BY DATE_TRUNC('day', calculated_at), calculated_at DESC
        ),
        slots AS (
          SELECT generate_series(
            DATE_TRUNC('day', (SELECT date_from FROM period)),
            DATE_TRUNC('day', NOW()),
            INTERVAL '1 day'
          ) AS day
        )
        SELECT
          s.day                            AS time,
          COALESCE(d.uptime_ratio, 0)      AS "uptimeRatio",
          1 - COALESCE(d.uptime_ratio, 0)  AS "downtimeRatio"
        FROM slots s
        LEFT JOIN daily d ON d.day = s.day
        ORDER BY s.day ASC
      `;
    }

    const rows = await this.rankingRepository.query<{
      time: Date;
      uptimeRatio: number;
      downtimeRatio: number;
    }[]>(sql, [id]);

    return {
      points: rows.map((r) => ({
        time: new Date(r.time).toISOString(),
        uptimeRatio: Number(r.uptimeRatio),
        downtimeRatio: Number(r.downtimeRatio),
      })),
    };
  }
}
