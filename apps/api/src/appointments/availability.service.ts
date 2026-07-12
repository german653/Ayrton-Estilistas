import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

type TimeRange = [string, string]; // ["09:00", "13:00"]

type WeeklyHours = Record<string, TimeRange[]>; // "mon" -> [["09:00","13:00"], ...]

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const SLOT_GRANULARITY_MIN = 15; // reservado para uso futuro, ver nota en buildSlotsForRanges

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Devuelve los horarios de inicio disponibles (ISO strings) para un
   * servicio en una fecha dada, opcionalmente filtrado por empleado.
   */
  async getAvailableSlots(tenantId: string, serviceId: string, dateISO: string, employeeId?: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId, isActive: true },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(employeeId ? { id: employeeId } : {}),
        services: { some: { serviceId } },
      },
    });

    const business = await this.prisma.businessProfile.findUnique({ where: { tenantId } });
    const businessHours = (business?.businessHours as unknown as WeeklyHours) ?? defaultBusinessHours();

    const dayKey = WEEKDAY_KEYS[new Date(dateISO + 'T00:00:00').getDay()];
    const results: { employeeId: string; employeeName: string; slots: string[] }[] = [];

    for (const employee of employees) {
      const employeeHours = (employee.workingHours as unknown as WeeklyHours) ?? businessHours;
      const ranges = employeeHours[dayKey] ?? businessHours[dayKey] ?? [];
      if (ranges.length === 0) continue;

      const existingAppointments = await this.prisma.appointment.findMany({
        where: {
          tenantId,
          employeeId: employee.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startsAt: { gte: new Date(`${dateISO}T00:00:00`), lt: new Date(`${dateISO}T23:59:59`) },
        },
      });

      const slots = buildSlotsForRanges(dateISO, ranges, service.durationMin, existingAppointments);
      if (slots.length) {
        results.push({ employeeId: employee.id, employeeName: employee.fullName, slots });
      }
    }

    return results;
  }

  async assertSlotIsFree(tenantId: string, employeeId: string, startsAt: Date, endsAt: Date) {
    const overlapping = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        employeeId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
      },
    });
    return !overlapping;
  }
}

function defaultBusinessHours(): WeeklyHours {
  const standard: TimeRange[] = [['09:00', '13:00'], ['16:00', '20:00']];
  return { mon: standard, tue: standard, wed: standard, thu: standard, fri: standard, sat: [['09:00', '13:00']], sun: [] };
}

function buildSlotsForRanges(
  dateISO: string,
  ranges: TimeRange[],
  durationMin: number,
  existing: { startsAt: Date; endsAt: Date }[],
): string[] {
  const slots: string[] = [];

  for (const range of ranges) {
    let cursor = toDate(dateISO, range[0]);
    const rangeEnd = toDate(dateISO, range[1]);

    while (addMinutes(cursor, durationMin) <= rangeEnd) {
      const slotEnd = addMinutes(cursor, durationMin);
      const overlaps = existing.some((e) => cursor < e.endsAt && slotEnd > e.startsAt);
      if (!overlaps && cursor.getTime() > Date.now()) {
        slots.push(cursor.toISOString());
      }
      cursor = addMinutes(cursor, durationMin);
    }
  }
  return slots;
}

function toDate(dateISO: string, hhmm: string): Date {
  return new Date(`${dateISO}T${hhmm}:00`);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}
