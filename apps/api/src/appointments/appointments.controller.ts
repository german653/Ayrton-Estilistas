import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AvailabilityService } from './availability.service';
import { CheckAvailabilityDto, CreateAppointmentDto, RescheduleAppointmentDto } from './dto';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly availability: AvailabilityService,
  ) {}

  @Get('availability')
  checkAvailability(@CurrentTenantId() tenantId: string, @Query() query: CheckAvailabilityDto) {
    return this.availability.getAvailableSlots(tenantId, query.serviceId, query.date, query.employeeId);
  }

  @Post()
  create(@CurrentTenantId() tenantId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(tenantId, dto);
  }

  @Patch(':id/cancel')
  cancel(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.appointments.cancel(tenantId, id);
  }

  @Patch(':id/reschedule')
  reschedule(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointments.reschedule(tenantId, id, dto);
  }

  @Patch(':id/complete')
  complete(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.appointments.complete(tenantId, id);
  }

  @Get('upcoming')
  upcoming(@CurrentTenantId() tenantId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.appointments.listUpcoming(tenantId, new Date(from), new Date(to));
  }
}
