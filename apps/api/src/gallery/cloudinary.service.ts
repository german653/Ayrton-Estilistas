import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary no está configurado (faltan CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET). La galería de imágenes no va a funcionar hasta cargarlas.',
      );
      return;
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    this.configured = true;
  }

  async uploadImage(fileBuffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
    if (!this.configured) {
      throw new InternalServerErrorException('Cloudinary no está configurado en el servidor.');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary no devolvió resultado'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      });
      stream.end(fileBuffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.configured) return;
    await cloudinary.uploader.destroy(publicId);
  }
}
