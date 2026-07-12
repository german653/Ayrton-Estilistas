import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get() list(@CurrentTenantId() tenantId: string, @Query('search') search?: string) {
    return this.customers.list(tenantId, search);
  }

  @Get(':id') getOne(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.customers.getWithHistory(tenantId, id);
  }

  @Patch(':id') update(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.customers.update(tenantId, id, body);
  }
}
