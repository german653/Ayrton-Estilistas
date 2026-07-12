import { Body, Controller, Get, NotFoundException, Patch, Post } from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AgentService } from './agent.service';
import { PrismaService } from '../common/prisma.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';
import { Public } from '../auth/jwt-auth.guard';

class UpdateAgentConfigDto {
  @IsOptional() @IsString() systemPrompt?: string;
  @IsOptional() @IsString() greetingMessage?: string;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(1) temperature?: number;
}

class WebChatMessageDto {
  @IsString() tenantSlug: string;
  @IsString() sessionId: string;
  @IsString() text: string;
}

@Controller('agent')
export class AgentController {
  constructor(private readonly agent: AgentService, private readonly prisma: PrismaService) {}

  @Get('config')
  getConfig(@CurrentTenantId() tenantId: string) {
    return this.prisma.agentConfig.findUnique({ where: { tenantId } });
  }

  @Patch('config')
  updateConfig(@CurrentTenantId() tenantId: string, @Body() dto: UpdateAgentConfigDto) {
    return this.prisma.agentConfig.update({ where: { tenantId }, data: dto });
  }

  /** Endpoint público (sin JWT) usado por el widget de chat del sitio del negocio.
   *  El tenant se resuelve por slug, no por sesión, porque el visitante no está logueado. */
  @Public()
  @Post('web-chat')
  async webChat(@Body() dto: WebChatMessageDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant || !tenant.isActive) throw new NotFoundException('Negocio no encontrado');

    return this.agent.handleIncomingMessage({
      tenantId: tenant.id,
      channel: 'WEB',
      externalUserId: dto.sessionId,
      text: dto.text,
    });
  }
}
