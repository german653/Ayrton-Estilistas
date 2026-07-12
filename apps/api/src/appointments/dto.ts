import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CheckAvailabilityDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsDateString()
  date: string; // YYYY-MM-DD, en zona horaria del tenant
}

export class CreateAppointmentDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  serviceId: string;

  @IsUUID()
  employeeId: string;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

export class RescheduleAppointmentDto {
  @IsDateString()
  newStartsAt: string;
}
