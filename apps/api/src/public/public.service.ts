import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { AvailabilityService } from '../appointments/availability.service';
import { getLoyaltyTier } from './loyalty';
import { PublicBookDto, PublicLoginDto, PublicRegisterDto } from './dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly appointments: AppointmentsService,
    private readonly availability: AvailabilityService,
  ) {}

  async resolveTenant(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.isActive) throw new NotFoundException('Negocio no encontrado');
    return tenant;
  }

  async getServices(slug: string) {
    const tenant = await this.resolveTenant(slug);
    return this.prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, name: true, description: true, durationMin: true, priceCents: true },
      orderBy: { name: 'asc' },
    });
  }

  async getAvailability(slug: string, serviceId: string, date: string, employeeId?: string) {
    const tenant = await this.resolveTenant(slug);
    return this.availability.getAvailableSlots(tenant.id, serviceId, date, employeeId);
  }

  async book(slug: string, dto: PublicBookDto) {
    const tenant = await this.resolveTenant(slug);

    let customer = await this.prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId: tenant.id, phone: dto.customerPhone } },
    });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { tenantId: tenant.id, phone: dto.customerPhone, fullName: dto.customerFullName },
      });
    } else if (!customer.fullName) {
      customer = await this.prisma.customer.update({ where: { id: customer.id }, data: { fullName: dto.customerFullName } });
    }

    return this.appointments.create(tenant.id, {
      customerId: customer.id,
      serviceId: dto.serviceId,
      employeeId: dto.employeeId,
      startsAt: dto.startsAt,
      source: 'web-publico',
    });
  }

  async register(slug: string, dto: PublicRegisterDto) {
    const tenant = await this.resolveTenant(slug);

    const existingByPhone = await this.prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId: tenant.id, phone: dto.phone } },
    });
    if (existingByPhone?.passwordHash) {
      throw new BadRequestException('Ya existe una cuenta con ese teléfono. Iniciá sesión en vez de registrarte.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const customer = existingByPhone
      ? await this.prisma.customer.update({
          where: { id: existingByPhone.id },
          data: { passwordHash, fullName: dto.fullName, email: dto.email },
        })
      : await this.prisma.customer.create({
          data: { tenantId: tenant.id, phone: dto.phone, fullName: dto.fullName, email: dto.email, passwordHash },
        });

    return this.issueToken(customer.id, tenant.id);
  }

  async login(slug: string, dto: PublicLoginDto) {
    const tenant = await this.resolveTenant(slug);

    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [{ phone: dto.identifier }, { email: dto.identifier }],
      },
    });

    if (!customer?.passwordHash) throw new UnauthorizedException('Credenciales inválidas');
    const valid = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return this.issueToken(customer.id, tenant.id);
  }

  async me(customerToken: string) {
    const payload = this.verifyToken(customerToken);
    const customer = await this.prisma.customer.findUnique({ where: { id: payload.customerId } });
    if (!customer) throw new UnauthorizedException();

    const loyalty = getLoyaltyTier(customer.totalVisits);
    return {
      fullName: customer.fullName,
      totalVisits: customer.totalVisits,
      loyalty,
    };
  }

  private issueToken(customerId: string, tenantId: string) {
    return {
      accessToken: this.jwt.sign({ customerId, tenantId, type: 'customer' }, { expiresIn: '90d' }),
    };
  }

  private verifyToken(token: string): { customerId: string; tenantId: string; type: string } {
    try {
      const payload = this.jwt.verify(token);
      if (payload.type !== 'customer') throw new Error('token inválido');
      return payload;
    } catch {
      throw new UnauthorizedException('Sesión inválida o vencida');
    }
  }
}
