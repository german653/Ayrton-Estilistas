import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

@Controller('tenants/me')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('profile') getProfile(@CurrentTenantId() tenantId: string) { return this.tenants.getProfile(tenantId); }
  @Patch('profile') updateProfile(@CurrentTenantId() tenantId: string, @Body() body: any) { return this.tenants.updateProfile(tenantId, body); }

  @Get('channels') listChannels(@CurrentTenantId() tenantId: string) { return this.tenants.listChannels(tenantId); }
  @Post('channels/:channel') connectChannel(
    @CurrentTenantId() tenantId: string,
    @Param('channel') channel: 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER',
    @Body() body: { externalId: string; accessToken: string; displayLabel?: string },
  ) {
    return this.tenants.connectChannel(tenantId, channel, body.externalId, body.accessToken, body.displayLabel);
  }

  @Get('analytics') analytics(@CurrentTenantId() tenantId: string) { return this.tenants.getAnalyticsSummary(tenantId); }
}
