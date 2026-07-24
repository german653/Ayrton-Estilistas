import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TenantsModule } from './tenants/tenants.module';
import { EmployeesModule } from './employees/employees.module';
import { ServicesModule } from './services/services.module';
import { CustomersModule } from './customers/customers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ConversationsModule } from './conversations/conversations.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AgentModule } from './agent/agent.module';
import { WhatsAppModule } from './channels/whatsapp/whatsapp.module';
import { MessengerModule } from './channels/messenger/messenger.module';
import { RemindersModule } from './reminders/reminders.module';
import { PromotionsModule } from './promotions/promotions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PublicModule } from './public/public.module';
import { GalleryModule } from './gallery/gallery.module';

/**
 * Soporta dos formas de configurar Redis:
 * - REDIS_URL (Railway y la mayoría de los hosts en la nube la exponen así, con
 *   contraseña incluida en la propia URL: redis://default:password@host:port)
 * - REDIS_HOST + REDIS_PORT (+ REDIS_PASSWORD opcional), como en docker-compose local.
 * `maxRetriesPerRequest: null` es obligatorio para BullMQ, si no tira error al arrancar.
 */
function buildRedisConnection(): any {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    BullModule.forRoot({
      connection: buildRedisConnection(),
    }),

    AuthModule,
    TenantsModule,
    EmployeesModule,
    ServicesModule,
    CustomersModule,
    AppointmentsModule,
    ConversationsModule,
    KnowledgeModule,
    AgentModule,
    WhatsAppModule,
    MessengerModule,
    RemindersModule,
    PromotionsModule,
    ReviewsModule,
    PublicModule,
    GalleryModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
