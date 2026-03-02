export type SocialProviderName = 'google' | 'github';

export interface SocialProvider {
  id: string; // UUID
  userId: string; // UUID
  providerName: SocialProviderName;
  providerId: string; // The unique ID returned by the provider
  createdAt: Date;
}
