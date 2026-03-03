import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { FileUploadService } from '@/modules/files/services/file-upload.service';

export function registerFilesBindings(container: DependencyContainer): void {
  container.register(Tokens.Files.FileUploadService, { useClass: FileUploadService });
}
