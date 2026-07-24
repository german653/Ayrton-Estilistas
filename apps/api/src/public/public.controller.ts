import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicAvailabilityQueryDto, PublicBookDto, PublicLoginDto, PublicRegisterDto } from './dto';
import { Public } from '../auth/jwt-auth.guard';

@Public()
@Controller('public/:tenantSlug')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('services')
  services(@Param('tenantSlug') slug: string) {
    return this.publicService.getServices(slug);
  }

  @Get('gallery')
  gallery(@Param('tenantSlug') slug: string) {
    return this.publicService.getGallery(slug);
  }

  @Get('availability')
  availability(@Param('tenantSlug') slug: string, @Query() query: PublicAvailabilityQueryDto) {
    return this.publicService.getAvailability(slug, query.serviceId, query.date, query.employeeId);
  }

  @Post('book')
  book(@Param('tenantSlug') slug: string, @Body() dto: PublicBookDto) {
    return this.publicService.book(slug, dto);
  }

  @Post('register')
  register(@Param('tenantSlug') slug: string, @Body() dto: PublicRegisterDto) {
    return this.publicService.register(slug, dto);
  }

  @Post('login')
  login(@Param('tenantSlug') slug: string, @Body() dto: PublicLoginDto) {
    return this.publicService.login(slug, dto);
  }

  @Get('me')
  me(@Param('tenantSlug') slug: string, @Headers('authorization') authHeader?: string) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Falta el token de sesión');
    return this.publicService.me(token);
  }
}
