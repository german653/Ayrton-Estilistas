import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { LoginDto, RegisterTenantDto } from './dto';
import { slugify } from '../common/slugify';

const DEFAULT_SYSTEM_PROMPT = `Eres el asistente virtual de este negocio. Respondé siempre en español
rioplatense, de forma breve, cálida y profesional. Tu trabajo es resolver la
consulta del cliente usando las herramientas disponibles (consultar
disponibilidad, reservar, cancelar o modificar turnos, y buscar en la base de
conocimientos). Si no podés resolver algo o el cliente lo pide explícitamente,
derivá la conversación a un humano. Nunca inventes horarios, precios ni
políticas: si no está en el contexto o en las herramientas, decilo con
honestidad y ofrecé derivar.`;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueToken(user.id, user.tenantId, user.role, user.email);
  }

  /** Alta de un nuevo negocio (tenant) + usuario OWNER, con su config de agente por defecto. */
  async registerTenant(dto: RegisterTenantDto) {
    const slug = slugify(dto.businessName);
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ya existe un negocio con ese nombre');

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 12);

    const tenant = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: { slug, name: dto.businessName },
      });

      await tx.user.create({
        data: {
          tenantId: created.id,
          email: dto.ownerEmail,
          passwordHash,
          fullName: dto.ownerFullName,
          role: 'OWNER',
        },
      });

      await tx.agentConfig.create({
        data: {
          tenantId: created.id,
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
        },
      });

      await tx.businessProfile.create({
        data: { tenantId: created.id },
      });

      return created;
    });

    const owner = await this.prisma.user.findFirstOrThrow({ where: { tenantId: tenant.id } });
    return this.issueToken(owner.id, tenant.id, owner.role, owner.email);
  }

  private issueToken(userId: string, tenantId: string, role: string, email: string) {
    const payload = { sub: userId, tenantId, role, email };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '30d' }),
    };
  }
}
