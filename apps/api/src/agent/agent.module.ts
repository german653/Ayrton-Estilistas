import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AgentToolExecutor } from './agent-tool-executor.service';
import { PrismaService } from '../common/prisma.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [AppointmentsModule, KnowledgeModule, ConversationsModule],
  controllers: [AgentController],
  providers: [AgentService, AgentToolExecutor, PrismaService],
  exports: [AgentService],
})
export class AgentModule {}
