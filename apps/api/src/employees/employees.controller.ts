import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get() list(@CurrentTenantId() tenantId: string) { return this.employees.list(tenantId); }

  @Post() create(@CurrentTenantId() tenantId: string, @Body() body: any) { return this.employees.create(tenantId, body); }

  @Patch(':id') update(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.employees.update(tenantId, id, body);
  }

  @Delete(':id') remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.employees.remove(tenantId, id);
  }
}
