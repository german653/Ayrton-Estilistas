import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { EmbeddingsService } from './embeddings.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeService, EmbeddingsService, PrismaService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
