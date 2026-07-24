import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  list(tenantId: string) {
    return this.prisma.galleryImage.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
    });
  }

  async upload(tenantId: string, file: Express.Multer.File, caption?: string) {
    const { url, publicId } = await this.cloudinary.uploadImage(file.buffer, `ayrton-saas/${tenantId}`);
    const count = await this.prisma.galleryImage.count({ where: { tenantId } });
    return this.prisma.galleryImage.create({
      data: { tenantId, url, publicId, caption, order: count },
    });
  }

  async remove(tenantId: string, id: string) {
    const image = await this.prisma.galleryImage.findFirst({ where: { id, tenantId } });
    if (!image) throw new NotFoundException('Imagen no encontrada');
    await this.cloudinary.deleteImage(image.publicId);
    return this.prisma.galleryImage.delete({ where: { id } });
  }
}
