import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma.service';

export const REMINDERS_QUEUE = 'reminders';
export const REVIEWS_QUEUE = 'reviews';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(REMINDERS_QUEUE) private readonly remindersQueue: Queue,
    @InjectQueue(REVIEWS_QUEUE) private readonly reviewsQueue: Queue,
  ) {}

  /** Cada 15 minutos: busca turnos confirmados que empiezan en ~24h y encola su recordatorio. */
  @Cron('0 */15 * * * *')
  async scheduleUpcomingReminders() {
    const windowStart = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(Date.now() + 25 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: { status: 'CONFIRMED', startsAt: { gte: windowStart, lte: windowEnd } },
      include: { customer: true, service: true, tenant: true },
    });

    for (const appt of appointments) {
      const alreadyScheduled = await this.prisma.reminder.findFirst({
        where: { appointmentId: appt.id },
      });
      if (alreadyScheduled || !appt.customer.phone) continue;

      await this.prisma.reminder.create({
        data: {
          tenantId: appt.tenantId,
          appointmentId: appt.id,
          scheduledFor: new Date(appt.startsAt.getTime() - 24 * 60 * 60 * 1000),
          channel: 'WHATSAPP',
          status: 'SCHEDULED',
          payload: {
            phone: appt.customer.phone,
            text: `Hola ${appt.customer.fullName ?? ''}! Te recordamos tu turno de ${appt.service.name} en ${appt.tenant.name} mañana a las ${appt.startsAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}. ¿Se mantiene?`,
          },
        },
      });

      await this.remindersQueue.add('send-reminder', { appointmentId: appt.id }, { delay: 0 });
    }

    this.logger.log(`Recordatorios evaluados: ${appointments.length} turnos en ventana de 24h`);
  }

  /** Cada hora: busca turnos completados hace >2h sin solicitud de reseña y la encola. */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleReviewRequests() {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const completed = await this.prisma.appointment.findMany({
      where: { status: 'COMPLETED', updatedAt: { lte: cutoff, gte: new Date(Date.now() - 26 * 60 * 60 * 1000) } },
      include: { customer: true },
    });

    for (const appt of completed) {
      const existing = await this.prisma.reviewRequest.findFirst({
        where: { customerId: appt.customerId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
      if (existing || !appt.customer.phone) continue;

      const reviewRequest = await this.prisma.reviewRequest.create({
        data: { tenantId: appt.tenantId, customerId: appt.customerId },
      });
      await this.reviewsQueue.add('send-review-request', { reviewRequestId: reviewRequest.id });
    }
  }
}
