export type SocialProviderName = 'google' | 'github';

export interface SocialProvider {
  id: bigint;
  userId: bigint;
  providerName: SocialProviderName;
  providerId: string; // The unique ID returned by the provider
  createdAt: Date;
}
