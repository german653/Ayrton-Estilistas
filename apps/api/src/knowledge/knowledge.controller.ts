import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { KnowledgeService } from './knowledge.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

class IngestDocumentDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  sourceType?: string;
}

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string) {
    return this.knowledge.listDocuments(tenantId);
  }

  @Post()
  ingest(@CurrentTenantId() tenantId: string, @Body() dto: IngestDocumentDto) {
    return this.knowledge.ingestDocument(tenantId, dto.title, dto.content, dto.sourceType);
  }

  @Delete(':id')
  remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.knowledge.deleteDocument(tenantId, id);
  }
}
