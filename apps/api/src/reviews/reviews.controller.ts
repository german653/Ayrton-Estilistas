import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get() list(@CurrentTenantId() tenantId: string) {
    return this.prisma.reviewRequest.findMany({ where: { tenantId }, include: { customer: true }, orderBy: { createdAt: 'desc' } });
  }

  @Patch(':id/respond') respond(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Body() body: { rating: number; comment?: string }) {
    return this.prisma.reviewRequest.update({
      where: { id },
      data: { rating: body.rating, comment: body.comment, respondedAt: new Date() },
    });
  }
}
