import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EmbeddingsService } from './embeddings.service';

const CHUNK_SIZE_CHARS = 900;
const CHUNK_OVERLAP_CHARS = 150;

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  async ingestDocument(tenantId: string, title: string, rawContent: string, sourceType = 'manual') {
    const document = await this.prisma.knowledgeDocument.create({
      data: { tenantId, title, rawContent, sourceType },
    });

    const chunks = chunkText(rawContent);
    const vectors = await this.embeddings.embedBatch(chunks);

    await this.prisma.$transaction(
      chunks.map((content, i) =>
        this.prisma.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks (id, "documentId", "tenantId", content, embedding)
           VALUES (gen_random_uuid(), $1, $2, $3, $4::vector)`,
          document.id,
          tenantId,
          content,
          JSON.stringify(vectors[i]),
        ),
      ),
    );

    this.logger.log(`Documento "${title}" ingerido con ${chunks.length} chunks (tenant ${tenantId})`);
    return document;
  }

  async deleteDocument(tenantId: string, documentId: string) {
    return this.prisma.knowledgeDocument.deleteMany({ where: { id: documentId, tenantId } });
  }

  /** Búsqueda semántica top-K de chunks relevantes para una consulta del cliente. */
  async search(tenantId: string, query: string, topK = 4): Promise<string[]> {
    const [queryVector] = await this.embeddings.embedBatch([query]);

    const rows = await this.prisma.$queryRawUnsafe<{ content: string }[]>(
      `SELECT content FROM knowledge_chunks
       WHERE "tenantId" = $1
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      tenantId,
      JSON.stringify(queryVector),
      topK,
    );

    return rows.map((r) => r.content);
  }

  async listDocuments(tenantId: string) {
    return this.prisma.knowledgeDocument.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, sourceType: true, createdAt: true },
    });
  }
}

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE_CHARS, clean.length);
    chunks.push(clean.slice(start, end));
    start += CHUNK_SIZE_CHARS - CHUNK_OVERLAP_CHARS;
  }
  return chunks;
}
