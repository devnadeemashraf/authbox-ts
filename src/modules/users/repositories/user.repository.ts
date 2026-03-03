import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { BaseRepository } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import type { User } from '@/core/interfaces/user.types';

@injectable()
export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';

  constructor(@inject(Tokens.Infrastructure.Database) db: Knex) {
    super(db);
  }

  protected toEntity(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string,
      username: row.username as string | null,
      passwordHash: row.passwordHash as string | null,
      isEmailVerified: Boolean(row.isEmailVerified),
      permissions: Number(row.permissions),
      tierId: Number(row.tierId),
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() });
  }
}
