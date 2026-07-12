import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.service.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  create(tenantId: string, data: { name: string; description?: string; durationMin: number; priceCents: number }) {
    return this.prisma.service.create({ data: { tenantId, ...data } });
  }

  async update(tenantId: string, id: string, data: Partial<{ name: string; description: string; durationMin: number; priceCents: number; isActive: boolean }>) {
    await this.assertOwned(tenantId, id);
    return this.prisma.service.update({ where: { id }, data });
  }

  /** Desactiva el servicio sin borrar su historial (turnos pasados siguen intactos). */
  async deactivate(tenantId: string, id: string) {
    await this.assertOwned(tenantId, id);
    return this.prisma.service.update({ where: { id }, data: { isActive: false } });
  }

  /** Borra el servicio de verdad. Si tiene turnos asociados, no se puede borrar (se protege el historial). */
  async remove(tenantId: string, id: string) {
    await this.assertOwned(tenantId, id);
    try {
      return await this.prisma.service.delete({ where: { id } });
    } catch (err: any) {
      if (err?.code === 'P2003') {
        throw new BadRequestException('No se puede eliminar: este servicio tiene turnos asociados. Desactivalo en su lugar.');
      }
      throw err;
    }
  }

  private async assertOwned(tenantId: string, id: string) {
    const service = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
  }
}
