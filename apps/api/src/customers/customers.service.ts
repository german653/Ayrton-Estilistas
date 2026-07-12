import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        // Se ocultan los registros "fantasma": sesiones de chat que nunca dejaron
        // ni teléfono ni email. No son clientes reales, solo ruido de pruebas.
        OR: [{ phone: { not: null } }, { email: { not: null } }],
        ...(search ? { AND: [{ OR: [{ fullName: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWithHistory(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        appointments: { include: { service: true, employee: true }, orderBy: { startsAt: 'desc' } },
        conversations: { include: { messages: { orderBy: { createdAt: 'asc' } } } },
      },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  update(tenantId: string, id: string, data: Partial<{ fullName: string; email: string; notes: string; tags: string[] }>) {
    return this.prisma.customer.update({ where: { id }, data });
  }
}
