import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AvailabilityService, PrismaService],
  exports: [AppointmentsService, AvailabilityService],
})
export class AppointmentsModule {}
