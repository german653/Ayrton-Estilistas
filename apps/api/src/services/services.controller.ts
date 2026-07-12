import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get() list(@CurrentTenantId() tenantId: string) { return this.services.list(tenantId); }
  @Post() create(@CurrentTenantId() tenantId: string, @Body() body: any) { return this.services.create(tenantId, body); }
  @Patch(':id') update(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Body() body: any) { return this.services.update(tenantId, id, body); }
  @Delete(':id') remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) { return this.services.remove(tenantId, id); }
}
