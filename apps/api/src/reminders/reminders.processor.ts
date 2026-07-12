import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WhatsAppApiClient } from '../channels/whatsapp/whatsapp-api.client';
import { REMINDERS_QUEUE, REVIEWS_QUEUE } from './reminders.service';

@Processor(REMINDERS_QUEUE)
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(private readonly prisma: PrismaService, private readonly whatsapp: WhatsAppApiClient) {
    super();
  }

  async process(job: Job<{ appointmentId: string }>) {
    const reminder = await this.prisma.reminder.findFirst({ where: { appointmentId: job.data.appointmentId } });
    if (!reminder) return;

    const connection = await this.prisma.channelConnection.findFirst({
      where: { tenantId: reminder.tenantId, channel: 'WHATSAPP', isActive: true },
    });
    if (!connection) return;

    const payload = reminder.payload as { phone: string; text: string };
    const sent = await this.whatsapp.sendTextMessage(connection.externalId, connection.accessToken, payload.phone, payload.text);

    await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: sent ? 'SENT' : 'FAILED' },
    });
  }
}

@Processor(REVIEWS_QUEUE)
export class ReviewsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewsProcessor.name);

  constructor(private readonly prisma: PrismaService, private readonly whatsapp: WhatsAppApiClient) {
    super();
  }

  async process(job: Job<{ reviewRequestId: string }>) {
    const request = await this.prisma.reviewRequest.findUnique({
      where: { id: job.data.reviewRequestId },
      include: { customer: true, tenant: true },
    });
    if (!request || !request.customer.phone) return;

    const connection = await this.prisma.channelConnection.findFirst({
      where: { tenantId: request.tenantId, channel: 'WHATSAPP', isActive: true },
    });
    if (!connection) return;

    const text = `¡Gracias por visitar ${request.tenant.name}! ¿Nos dejás una reseña del 1 al 5 y algún comentario? Tu opinión nos ayuda mucho 🙏`;
    await this.whatsapp.sendTextMessage(connection.externalId, connection.accessToken, request.customer.phone, text);
    await this.prisma.reviewRequest.update({ where: { id: request.id }, data: { sentAt: new Date() } });
  }
}
