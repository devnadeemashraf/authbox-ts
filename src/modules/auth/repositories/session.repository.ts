import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { BaseRepository } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import type { Session } from '@/core/interfaces/session.types';

@injectable()
export class SessionRepository extends BaseRepository<Session> {
  protected tableName = 'sessions';

  constructor(@inject(Tokens.Infrastructure.Database) db: Knex) {
    super(db);
  }

  protected toEntity(row: Record<string, unknown>): Session {
    return {
      id: row.id as string,
      userId: row.userId as string,
      deviceInfo: row.deviceInfo as string | null,
      ipAddress: row.ipAddress as string | null,
      expiresAt: new Date(row.expiresAt as string),
      createdAt: new Date(row.createdAt as string),
    };
  }

  async countActiveByUserId(userId: string): Promise<number> {
    const result = await this.db(this.tableName)
      .where('userId', userId)
      .where('expiresAt', '>', this.db.fn.now())
      .count('* as count')
      .first();

    return Number(result?.count ?? 0);
  }
}
