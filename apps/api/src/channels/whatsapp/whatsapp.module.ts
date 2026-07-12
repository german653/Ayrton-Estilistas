import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { PrismaService } from '../../common/prisma.service';
import { AgentModule } from '../../agent/agent.module';

@Module({
  imports: [AgentModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppApiClient, PrismaService],
})
export class WhatsAppModule {}
