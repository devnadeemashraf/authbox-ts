import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { BaseRepository } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import type {
  VerificationToken,
  VerificationTokenType,
} from '@/core/interfaces/verification-token.types';

@injectable()
export class VerificationTokenRepository extends BaseRepository<VerificationToken> {
  protected tableName = 'verification_tokens';

  constructor(@inject(Tokens.Infrastructure.Database) db: Knex) {
    super(db);
  }

  protected toEntity(row: Record<string, unknown>): VerificationToken {
    return {
      id: row.id as string,
      userId: row.userId as string,
      type: row.type as VerificationTokenType,
      tokenHash: row.tokenHash as string,
      expiresAt: new Date(row.expiresAt as string),
      createdAt: new Date(row.createdAt as string),
    };
  }

  async findValidByUserIdAndType(
    userId: string,
    type: VerificationTokenType,
  ): Promise<VerificationToken | null> {
    const row = await this.db(this.tableName)
      .where('userId', userId)
      .where('type', type)
      .where('expiresAt', '>', this.db.fn.now())
      .orderBy('createdAt', 'desc')
      .first();

    return row ? this.toEntity(row as Record<string, unknown>) : null;
  }

  async invalidateByUserIdAndType(userId: string, type: VerificationTokenType): Promise<void> {
    await this.db(this.tableName).where('userId', userId).where('type', type).del();
  }
}
