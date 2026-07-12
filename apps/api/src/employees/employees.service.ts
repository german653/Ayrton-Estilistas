import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.employee.findMany({ where: { tenantId }, include: { services: { include: { service: true } } } });
  }

  create(tenantId: string, data: { fullName: string; photoUrl?: string; serviceIds?: string[] }) {
    return this.prisma.employee.create({
      data: {
        tenantId,
        fullName: data.fullName,
        photoUrl: data.photoUrl,
        services: data.serviceIds ? { create: data.serviceIds.map((serviceId) => ({ serviceId })) } : undefined,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: { fullName?: string; photoUrl?: string; isActive?: boolean; workingHours?: unknown; serviceIds?: string[] },
  ) {
    await this.assertOwned(tenantId, id);
    const { serviceIds, ...rest } = data;

    if (serviceIds) {
      await this.prisma.employeeService.deleteMany({ where: { employeeId: id } });
      if (serviceIds.length > 0) {
        await this.prisma.employeeService.createMany({
          data: serviceIds.map((serviceId) => ({ employeeId: id, serviceId })),
        });
      }
    }

    return this.prisma.employee.update({ where: { id }, data: rest as never });
  }

  /** Borra el empleado de verdad. Si tiene turnos asociados, no se puede borrar (se protege el historial). */
  async remove(tenantId: string, id: string) {
    await this.assertOwned(tenantId, id);
    try {
      return await this.prisma.employee.delete({ where: { id } });
    } catch (err: any) {
      if (err?.code === 'P2003') {
        throw new BadRequestException('No se puede eliminar: este empleado tiene turnos asociados. Desactivalo en su lugar.');
      }
      throw err;
    }
  }

  private async assertOwned(tenantId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id, tenantId } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
  }
}
