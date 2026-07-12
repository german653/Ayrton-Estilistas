import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { PrismaService } from '../common/prisma.service';
import { WhatsAppApiClient } from '../channels/whatsapp/whatsapp-api.client';

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService, PrismaService, WhatsAppApiClient],
})
export class PromotionsModule {}
