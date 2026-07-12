import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersService, REMINDERS_QUEUE, REVIEWS_QUEUE } from './reminders.service';
import { RemindersProcessor, ReviewsProcessor } from './reminders.processor';
import { PrismaService } from '../common/prisma.service';
import { WhatsAppApiClient } from '../channels/whatsapp/whatsapp-api.client';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: REMINDERS_QUEUE }, { name: REVIEWS_QUEUE }),
  ],
  providers: [RemindersService, RemindersProcessor, ReviewsProcessor, PrismaService, WhatsAppApiClient],
})
export class RemindersModule {}
