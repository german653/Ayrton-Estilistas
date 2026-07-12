import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  getProfile(tenantId: string) {
    return this.prisma.businessProfile.findUnique({ where: { tenantId } });
  }

  updateProfile(tenantId: string, data: any) {
    return this.prisma.businessProfile.update({ where: { tenantId }, data });
  }

  async connectChannel(
    tenantId: string,
    channel: 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER',
    externalId: string,
    accessToken: string,
    displayLabel?: string,
  ) {
    const existing = await this.prisma.channelConnection.findUnique({
      where: { tenantId_channel: { tenantId, channel } },
    });

    // Si el campo viene vacío, se conserva el valor existente en vez de borrarlo.
    const finalExternalId = externalId?.trim() ? externalId.trim() : existing?.externalId;
    const finalAccessToken = accessToken?.trim() ? accessToken.trim() : existing?.accessToken;

    if (!finalExternalId || !finalAccessToken) {
      throw new BadRequestException('Se necesita el ID técnico y el token de acceso para conectar el canal por primera vez.');
    }

    return this.prisma.channelConnection.upsert({
      where: { tenantId_channel: { tenantId, channel } },
      update: { externalId: finalExternalId, accessToken: finalAccessToken, displayLabel, isActive: true },
      create: { tenantId, channel, externalId: finalExternalId, accessToken: finalAccessToken, displayLabel },
    });
  }

  listChannels(tenantId: string) {
    return this.prisma.channelConnection.findMany({
      where: { tenantId },
      select: { id: true, channel: true, displayLabel: true, isActive: true, createdAt: true, updatedAt: true },
    });
  }

  async getAnalyticsSummary(tenantId: string) {
    const [totalCustomers, upcomingAppointments, completedThisMonth, openConversations] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.appointment.count({ where: { tenantId, status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { gte: new Date() } } }),
      this.prisma.appointment.count({
        where: { tenantId, status: 'COMPLETED', updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
      this.prisma.conversation.count({ where: { tenantId, status: { in: ['OPEN', 'WAITING_HUMAN'] } } }),
    ]);
    return { totalCustomers, upcomingAppointments, completedThisMonth, openConversations };
  }
}
