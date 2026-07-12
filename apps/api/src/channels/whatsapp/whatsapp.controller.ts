import { Body, Controller, Get, HttpCode, Logger, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';
import { AgentService } from '../../agent/agent.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { Public } from '../../auth/jwt-auth.guard';

interface WhatsAppWebhookBody {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id: string };
        messages?: { from: string; text?: { body: string }; type: string }[];
        contacts?: { profile?: { name: string } }[];
      };
    }[];
  }[];
}

@Controller('channels/whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly agent: AgentService,
    private readonly whatsappApi: WhatsAppApiClient,
  ) {}

  /** Verificación del webhook exigida por Meta al configurar la integración. */
  @Public()
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  /** Recepción de mensajes entrantes. Meta envía el mismo formato para todos los tenants;
   *  identificamos al tenant por el phone_number_id registrado en ChannelConnection. */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async receiveWebhook(@Body() body: WhatsAppWebhookBody) {
    try {
      const change = body.entry?.[0]?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      if (!change || !message || message.type !== 'text') return { received: true };

      const phoneNumberId = change.metadata?.phone_number_id;
      const connection = await this.prisma.channelConnection.findFirst({
        where: { channel: 'WHATSAPP', externalId: phoneNumberId, isActive: true },
      });
      if (!connection) {
        this.logger.warn(`Mensaje de WhatsApp recibido sin conexión registrada: ${phoneNumberId}`);
        return { received: true };
      }

      const customerName = change.contacts?.[0]?.profile?.name;
      const result = await this.agent.handleIncomingMessage({
        tenantId: connection.tenantId,
        channel: 'WHATSAPP',
        externalUserId: message.from,
        customerPhone: message.from,
        text: message.text!.body,
      });

      if (result.reply) {
        await this.whatsappApi.sendTextMessage(
          connection.externalId,
          connection.accessToken,
          message.from,
          result.reply,
        );
      }

      void customerName; // reservado para enriquecer el perfil del cliente en un siguiente paso
      return { received: true };
    } catch (err) {
      this.logger.error('Error procesando webhook de WhatsApp', err as Error);
      return { received: true };
    }
  }
}
