import fs from 'fs';
import path from 'path';
import * as Minio from 'minio';
import { ENV } from '../../config/env';
import { encryptBuffer, decryptBuffer, sha256 } from '../../utils/crypto';

export class StorageService {
  private static minioClient: Minio.Client | null = null;
  private static localVaultDir = path.resolve(__dirname, '../../../uploads/vault');

  static {
    // Ensure local vault fallback directory exists
    if (!fs.existsSync(this.localVaultDir)) {
      fs.mkdirSync(this.localVaultDir, { recursive: true });
    }

    // Try initializing MinIO client
    try {
      this.minioClient = new Minio.Client({
        endPoint: ENV.MINIO_ENDPOINT,
        port: ENV.MINIO_PORT,
        useSSL: ENV.MINIO_USE_SSL,
        accessKey: ENV.MINIO_ACCESS_KEY,
        secretKey: ENV.MINIO_SECRET_KEY,
      });
    } catch (e) {
      console.warn('⚠️ MinIO client init skipped, will use local encrypted vault directory.');
    }
  }

  /**
   * Encrypts and saves file to MinIO S3 or local encrypted vault fallback
   */
  public static async uploadEncrypted(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<{ fileKey: string; fileSize: number; checksum: string }> {
    const checksum = sha256(fileBuffer);
    const encryptedBuffer = encryptBuffer(fileBuffer);
    const fileKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${path.basename(originalName)}`;

    let uploadedToMinio = false;

    if (this.minioClient) {
      try {
        const bucketExists = await this.minioClient.bucketExists(ENV.MINIO_BUCKET_NAME);
        if (!bucketExists) {
          await this.minioClient.makeBucket(ENV.MINIO_BUCKET_NAME, 'us-east-1');
        }
        await this.minioClient.putObject(
          ENV.MINIO_BUCKET_NAME,
          fileKey,
          encryptedBuffer,
          encryptedBuffer.length,
          {
            'Content-Type': 'application/octet-stream',
            'X-Amz-Meta-Encrypted': 'AES-256-GCM',
          }
        );
        uploadedToMinio = true;
      } catch (err) {
        // Fallback to local encrypted storage
      }
    }

    if (!uploadedToMinio) {
      const localFilePath = path.join(this.localVaultDir, fileKey);
      await fs.promises.writeFile(localFilePath, encryptedBuffer);
    }

    return {
      fileKey,
      fileSize: fileBuffer.length,
      checksum,
    };
  }

  /**
   * Retrieves and decrypts file from storage
   */
  public static async getDecrypted(fileKey: string): Promise<Buffer> {
    let encryptedBuffer: Buffer | null = null;

    if (this.minioClient) {
      try {
        const stream = await this.minioClient.getObject(ENV.MINIO_BUCKET_NAME, fileKey);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        encryptedBuffer = Buffer.concat(chunks);
      } catch (err) {
        // Fallback to local vault
      }
    }

    if (!encryptedBuffer) {
      const localFilePath = path.join(this.localVaultDir, fileKey);
      if (fs.existsSync(localFilePath)) {
        encryptedBuffer = await fs.promises.readFile(localFilePath);
      }
    }

    if (!encryptedBuffer) {
      throw new Error(`File key ${fileKey} not found in storage vault`);
    }

    return decryptBuffer(encryptedBuffer);
  }
}
