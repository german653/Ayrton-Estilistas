import { IsDateString, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class PublicRegisterDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class PublicLoginDto {
  @IsString()
  identifier: string; // email o teléfono

  @IsString()
  password: string;
}

export class PublicBookDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  employeeId: string;

  @IsDateString()
  startsAt: string;

  @IsString()
  customerFullName: string;

  @IsString()
  customerPhone: string;
}

export class PublicAvailabilityQueryDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsDateString()
  date: string;
}
