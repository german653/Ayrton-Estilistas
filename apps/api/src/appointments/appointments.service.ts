import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AvailabilityService } from './availability.service';
import { CreateAppointmentDto, RescheduleAppointmentDto } from './dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  async create(tenantId: string, dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(startsAt.getTime() + service.durationMin * 60000);

    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException('No se puede reservar un turno en el pasado');
    }

    const isFree = await this.availability.assertSlotIsFree(tenantId, dto.employeeId, startsAt, endsAt);
    if (!isFree) throw new BadRequestException('El horario seleccionado ya no está disponible');

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        employeeId: dto.employeeId,
        serviceId: dto.serviceId,
        startsAt,
        endsAt,
        status: 'CONFIRMED',
        source: dto.source ?? 'dashboard',
        notes: dto.notes,
      },
      include: { customer: true, employee: true, service: true },
    });

    await this.prisma.customer.update({
      where: { id: dto.customerId },
      data: { totalVisits: { increment: 0 } }, // se incrementa al completar, no al reservar
    });

    return appointment;
  }

  async cancel(tenantId: string, appointmentId: string) {
    const appointment = await this.findOwned(tenantId, appointmentId);
    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
    });
  }

  async reschedule(tenantId: string, appointmentId: string, dto: RescheduleAppointmentDto) {
    const appointment = await this.findOwned(tenantId, appointmentId);
    const service = await this.prisma.service.findFirstOrThrow({ where: { id: appointment.serviceId } });

    const newStart = new Date(dto.newStartsAt);
    const newEnd = new Date(newStart.getTime() + service.durationMin * 60000);

    const isFree = await this.availability.assertSlotIsFree(tenantId, appointment.employeeId, newStart, newEnd);
    if (!isFree) throw new BadRequestException('El nuevo horario no está disponible');

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { startsAt: newStart, endsAt: newEnd, status: 'CONFIRMED' },
    });
  }

  async complete(tenantId: string, appointmentId: string) {
    const appointment = await this.findOwned(tenantId, appointmentId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: 'COMPLETED' },
      });
      await tx.customer.update({
        where: { id: appointment.customerId },
        data: { totalVisits: { increment: 1 }, lastVisitAt: new Date() },
      });
      return updated;
    });
  }

  async listByCustomer(tenantId: string, customerId: string) {
    return this.prisma.appointment.findMany({
      where: { tenantId, customerId },
      include: { service: true, employee: true },
      orderBy: { startsAt: 'desc' },
    });
  }

  async listUpcoming(tenantId: string, from: Date, to: Date) {
    return this.prisma.appointment.findMany({
      where: { tenantId, startsAt: { gte: from, lte: to }, status: { in: ['PENDING', 'CONFIRMED'] } },
      include: { customer: true, employee: true, service: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  private async findOwned(tenantId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id: appointmentId, tenantId } });
    if (!appointment) throw new NotFoundException('Turno no encontrado');
    return appointment;
  }
}
