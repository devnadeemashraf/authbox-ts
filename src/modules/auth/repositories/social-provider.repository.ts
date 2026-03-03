import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import { BaseRepository } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import type { SocialProvider } from '@/core/interfaces/social-provider.type';

@injectable()
export class SocialProviderRepository extends BaseRepository<SocialProvider> {
  protected tableName = 'social_providers';

  constructor(@inject(Tokens.Infrastructure.Database) db: Knex) {
    super(db);
  }

  protected toEntity(row: Record<string, unknown>): SocialProvider {
    return {
      id: row.id as string,
      userId: row.userId as string,
      providerName: row.providerName as SocialProvider['providerName'],
      providerId: row.providerId as string,
      createdAt: new Date(row.createdAt as string),
    };
  }

  async findByProvider(providerName: string, providerId: string): Promise<SocialProvider | null> {
    return this.findOne({ providerName, providerId });
  }

  async findByUserIdAndProvider(
    userId: string,
    providerName: string,
  ): Promise<SocialProvider | null> {
    return this.findOne({ userId, providerName });
  }
}
