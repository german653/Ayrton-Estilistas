import { Module } from '@nestjs/common';
import { MessengerController } from './messenger.controller';
import { MetaGraphClient } from './meta-graph.client';
import { PrismaService } from '../../common/prisma.service';
import { AgentModule } from '../../agent/agent.module';

@Module({
  imports: [AgentModule],
  controllers: [MessengerController],
  providers: [MetaGraphClient, PrismaService],
})
export class MessengerModule {}
