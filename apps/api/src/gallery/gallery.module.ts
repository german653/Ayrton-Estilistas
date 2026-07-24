import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService, CloudinaryService, PrismaService],
  exports: [GalleryService],
})
export class GalleryModule {}
