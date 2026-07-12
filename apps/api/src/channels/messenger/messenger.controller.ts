import { Body, Controller, Get, HttpCode, Logger, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { AgentService } from '../../agent/agent.service';
import { MetaGraphClient } from './meta-graph.client';
import { Public } from '../../auth/jwt-auth.guard';

interface MetaWebhookBody {
  object: 'page' | 'instagram';
  entry?: {
    id: string; // page_id o ig_business_id
    messaging?: { sender: { id: string }; message?: { text?: string } }[];
  }[];
}

/** Maneja tanto Messenger (object="page") como Instagram DM (object="instagram"). */
@Controller('channels/meta')
export class MessengerController {
  private readonly logger = new Logger(MessengerController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly agent: AgentService,
    private readonly graph: MetaGraphClient,
  ) {}

  @Public()
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.get<string>('META_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected) return res.status(200).send(challenge);
    return res.status(403).send('Forbidden');
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async receiveWebhook(@Body() body: MetaWebhookBody) {
    try {
      const channel: ChannelType = body.object === 'instagram' ? 'INSTAGRAM' : 'MESSENGER';

      for (const entry of body.entry ?? []) {
        const event = entry.messaging?.[0];
        if (!event?.message?.text) continue;

        const connection = await this.prisma.channelConnection.findFirst({
          where: { channel, externalId: entry.id, isActive: true },
        });
        if (!connection) {
          this.logger.warn(`Mensaje ${channel} sin conexión registrada: page/ig id ${entry.id}`);
          continue;
        }

        const result = await this.agent.handleIncomingMessage({
          tenantId: connection.tenantId,
          channel,
          externalUserId: event.sender.id,
          text: event.message.text,
        });

        if (result.reply) {
          await this.graph.sendMessage(connection.accessToken, event.sender.id, result.reply);
        }
      }

      return { received: true };
    } catch (err) {
      this.logger.error('Error procesando webhook de Meta (Messenger/Instagram)', err as Error);
      return { received: true };
    }
  }
}
