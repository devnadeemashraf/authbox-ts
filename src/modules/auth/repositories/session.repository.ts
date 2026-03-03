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

  /** Lists active (non-expired) sessions for a user, ordered by createdAt desc. */
  async findActiveByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db(this.tableName)
      .where('userId', userId)
      .where('expiresAt', '>', this.db.fn.now())
      .orderBy('createdAt', 'desc');

    return rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  /** Deletes all sessions for a user. Returns number of deleted rows. */
  async deleteByUserId(userId: string): Promise<number> {
    return this.db(this.tableName).where('userId', userId).del();
  }
}
