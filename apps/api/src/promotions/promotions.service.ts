import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WhatsAppApiClient } from '../channels/whatsapp/whatsapp-api.client';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService, private readonly whatsapp: WhatsAppApiClient) {}

  list(tenantId: string) {
    return this.prisma.promotion.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  create(tenantId: string, data: { title: string; message: string; audience?: any; scheduledFor?: string }) {
    return this.prisma.promotion.create({
      data: {
        tenantId,
        title: data.title,
        message: data.message,
        channel: 'WHATSAPP',
        audience: data.audience,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      },
    });
  }

  /** Envío inmediato a la audiencia filtrada (tags de cliente). Pensado para disparo manual desde el dashboard. */
  async sendNow(tenantId: string, promotionId: string) {
    const promotion = await this.prisma.promotion.findFirstOrThrow({ where: { id: promotionId, tenantId } });
    const connection = await this.prisma.channelConnection.findFirst({ where: { tenantId, channel: 'WHATSAPP', isActive: true } });
    if (!connection) throw new Error('No hay conexión de WhatsApp activa para este negocio');

    const tags = (promotion.audience as { tags?: string[] } | null)?.tags;
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, phone: { not: null }, ...(tags?.length ? { tags: { hasSome: tags } } : {}) },
    });

    let sent = 0;
    for (const customer of customers) {
      if (!customer.phone) continue;
      const ok = await this.whatsapp.sendTextMessage(connection.externalId, connection.accessToken, customer.phone, promotion.message);
      if (ok) sent++;
    }

    await this.prisma.promotion.update({ where: { id: promotionId }, data: { sentAt: new Date() } });
    return { sent, total: customers.length };
  }
}
