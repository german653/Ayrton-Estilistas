import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaService } from '../common/prisma.service';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    AppointmentsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.get<string>('JWT_SECRET') }),
    }),
  ],
  controllers: [PublicController],
  providers: [PublicService, PrismaService],
})
export class PublicModule {}
