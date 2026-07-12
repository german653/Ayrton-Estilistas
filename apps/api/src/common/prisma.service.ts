import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService centraliza la conexión a la base de datos.
 * setTenantContext() fija `app.current_tenant_id` en la sesión de Postgres
 * para que las políticas de Row Level Security filtren automáticamente
 * todas las queries por tenant, incluso si algún repositorio olvida el
 * `where: { tenantId }` explícito.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async forTenant<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', $1, true)`, tenantId);
      return fn(tx as PrismaClient);
    });
  }
}
