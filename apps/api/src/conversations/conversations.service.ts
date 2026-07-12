import { Injectable } from '@nestjs/common';
import { ChannelType, MessageRole } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(tenantId: string, channel: ChannelType, externalUserId: string, customerId?: string) {
    const existing = await this.prisma.conversation.findUnique({
      where: { tenantId_channel_externalUserId: { tenantId, channel, externalUserId } },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { tenantId, channel, externalUserId, customerId },
    });
  }

  async appendMessage(conversationId: string, role: MessageRole, content: string, toolCalls?: unknown) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    return this.prisma.message.create({
      data: { conversationId, role, content, toolCalls: toolCalls as never },
    });
  }

  async getHistory(conversationId: string, limit = 20) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages.reverse();
  }

  async markHandedOff(conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { handedOffToHuman: true, status: 'WAITING_HUMAN' },
    });
  }

  async findOrCreateCustomerByPhone(tenantId: string, phone: string, fullName?: string) {
    const existing = await this.prisma.customer.findUnique({ where: { tenantId_phone: { tenantId, phone } } });
    if (existing) return existing;
    return this.prisma.customer.create({ data: { tenantId, phone, fullName } });
  }
}
