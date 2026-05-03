import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { withRetries } from '../utils/retry.js';
import { ToolExecutionError } from '../errors.js';

type StorageConfig = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export function createStorageClient(config: StorageConfig): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function uploadToStorage(
  client: S3Client,
  bucket: string,
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  try {
    await withRetries(async () => client.send(command), 2);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ToolExecutionError(`Storage upload failed: ${message}`, 'upload');
  }
}
