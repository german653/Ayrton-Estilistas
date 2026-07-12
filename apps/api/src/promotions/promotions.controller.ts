import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get() list(@CurrentTenantId() tenantId: string) { return this.promotions.list(tenantId); }
  @Post() create(@CurrentTenantId() tenantId: string, @Body() body: any) { return this.promotions.create(tenantId, body); }
  @Post(':id/send') send(@CurrentTenantId() tenantId: string, @Param('id') id: string) { return this.promotions.sendNow(tenantId, id); }
}
