import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface VoyageResponse {
  data: { embedding: number[] }[];
}

/**
 * Anthropic no expone una API de embeddings propia; usamos Voyage AI
 * (partner recomendado por Anthropic para RAG) con el modelo voyage-3-lite,
 * que produce vectores de 1536 dimensiones, igual que la columna definida
 * en el esquema de Prisma.
 */
@Injectable()
export class EmbeddingsService {
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('VOYAGE_API_KEY') ?? '';
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('VOYAGE_API_KEY no configurada');
    }

    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: 'voyage-3-lite',
        input_type: 'document',
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(`Error de Voyage AI: ${response.status}`);
    }

    const data = (await response.json()) as VoyageResponse;
    return data.data.map((d) => d.embedding);
  }
}
