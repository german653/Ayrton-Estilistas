import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GalleryService } from './gallery.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Controller('gallery')
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string) {
    return this.gallery.list(tenantId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('El archivo tiene que ser una imagen'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @CurrentTenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    if (!file) throw new BadRequestException('Falta el archivo de imagen');
    return this.gallery.upload(tenantId, file, caption);
  }

  @Delete(':id')
  remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.gallery.remove(tenantId, id);
  }
}
