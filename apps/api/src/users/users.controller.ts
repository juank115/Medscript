import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        doctor: { select: { id: true, specialty: true } },
        patient: { select: { id: true } },
      },
    });
  }

  @Roles(Role.ADMIN, Role.DOCTOR)
  @Get('patients')
  findPatients() {
    return this.prisma.patient.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}
