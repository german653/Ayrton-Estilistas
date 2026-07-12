import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { AvailabilityService } from '../appointments/availability.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { ConversationsService } from '../conversations/conversations.service';

interface ToolContext {
  tenantId: string;
  customerId: string;
  conversationId: string;
}

@Injectable()
export class AgentToolExecutor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appointments: AppointmentsService,
    private readonly availability: AvailabilityService,
    private readonly knowledge: KnowledgeService,
    private readonly conversations: ConversationsService,
  ) {}

  async execute(toolName: string, input: Record<string, any>, ctx: ToolContext): Promise<string> {
    switch (toolName) {
      case 'check_availability':
        return this.checkAvailability(ctx.tenantId, input);
      case 'book_appointment':
        return this.bookAppointment(ctx, input);
      case 'cancel_appointment':
        return this.cancelAppointment(ctx);
      case 'reschedule_appointment':
        return this.rescheduleAppointment(ctx, input);
      case 'search_knowledge_base':
        return this.searchKnowledge(ctx.tenantId, input);
      case 'request_human_handoff':
        return this.handoff(ctx, input);
      default:
        return JSON.stringify({ error: `Herramienta desconocida: ${toolName}` });
    }
  }

  private async findService(tenantId: string, name: string) {
    return this.prisma.service.findFirst({
      where: { tenantId, isActive: true, name: { contains: name, mode: 'insensitive' } },
    });
  }

  private async findEmployee(tenantId: string, name?: string) {
    if (!name) return null;
    return this.prisma.employee.findFirst({
      where: { tenantId, isActive: true, fullName: { contains: name, mode: 'insensitive' } },
    });
  }

  private async checkAvailability(tenantId: string, input: Record<string, any>) {
    const service = await this.findService(tenantId, input.service_name);
    if (!service) return JSON.stringify({ error: 'No encontré ese servicio en el catálogo del negocio.' });

    const employee = await this.findEmployee(tenantId, input.employee_name);
    const slots = await this.availability.getAvailableSlots(tenantId, service.id, input.date, employee?.id);

    if (!slots.length) return JSON.stringify({ available: false, message: 'No hay horarios disponibles ese día.' });
    return JSON.stringify({ available: true, options: slots });
  }

  private async bookAppointment(ctx: ToolContext, input: Record<string, any>) {
    const service = await this.findService(ctx.tenantId, input.service_name);
    if (!service) return JSON.stringify({ error: 'Servicio no encontrado.' });

    const employee = await this.findEmployee(ctx.tenantId, input.employee_name);
    if (!employee) return JSON.stringify({ error: 'Empleado no encontrado.' });

    await this.prisma.customer.update({
      where: { id: ctx.customerId },
      data: { fullName: input.customer_full_name },
    });

    try {
      const appointment = await this.appointments.create(ctx.tenantId, {
        customerId: ctx.customerId,
        serviceId: service.id,
        employeeId: employee.id,
        startsAt: input.starts_at,
        source: 'agent',
      });
      return JSON.stringify({
        success: true,
        appointmentId: appointment.id,
        startsAt: appointment.startsAt,
        service: service.name,
        employee: employee.fullName,
      });
    } catch (err) {
      return JSON.stringify({ error: (err as Error).message });
    }
  }

  private async cancelAppointment(ctx: ToolContext) {
    const next = await this.prisma.appointment.findFirst({
      where: { tenantId: ctx.tenantId, customerId: ctx.customerId, status: { in: ['PENDING', 'CONFIRMED'] } },
      orderBy: { startsAt: 'asc' },
    });
    if (!next) return JSON.stringify({ error: 'No encontré turnos activos para cancelar.' });

    await this.appointments.cancel(ctx.tenantId, next.id);
    return JSON.stringify({ success: true, cancelledAppointmentId: next.id });
  }

  private async rescheduleAppointment(ctx: ToolContext, input: Record<string, any>) {
    const next = await this.prisma.appointment.findFirst({
      where: { tenantId: ctx.tenantId, customerId: ctx.customerId, status: { in: ['PENDING', 'CONFIRMED'] } },
      orderBy: { startsAt: 'asc' },
    });
    if (!next) return JSON.stringify({ error: 'No encontré turnos activos para reprogramar.' });

    try {
      const updated = await this.appointments.reschedule(ctx.tenantId, next.id, { newStartsAt: input.new_starts_at });
      return JSON.stringify({ success: true, newStartsAt: updated.startsAt });
    } catch (err) {
      return JSON.stringify({ error: (err as Error).message });
    }
  }

  private async searchKnowledge(tenantId: string, input: Record<string, any>) {
    const results = await this.knowledge.search(tenantId, input.query);
    if (!results.length) return JSON.stringify({ found: false });
    return JSON.stringify({ found: true, context: results });
  }

  private async handoff(ctx: ToolContext, input: Record<string, any>) {
    await this.conversations.markHandedOff(ctx.conversationId);
    return JSON.stringify({ success: true, reason: input.reason ?? 'Solicitado' });
  }
}
