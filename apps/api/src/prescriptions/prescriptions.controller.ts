import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrescriptionsService } from './prescriptions.service';
import { PdfService } from './pdf.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { QueryPrescriptionsDto } from './dto/query-prescriptions.dto';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PrescriptionsController {
  constructor(
    private prescriptionsService: PrescriptionsService,
    private pdfService: PdfService,
    private config: ConfigService,
  ) {}

  // Doctor: create prescription
  @Roles(Role.DOCTOR)
  @Post('prescriptions')
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: User) {
    return this.prescriptionsService.create(dto, user);
  }

  // Doctor: list own prescriptions
  @Roles(Role.DOCTOR)
  @Get('prescriptions')
  findAllForDoctor(@Query() query: QueryPrescriptionsDto, @CurrentUser() user: User) {
    return this.prescriptionsService.findAllForDoctor(query, user);
  }

  // Patient: list own prescriptions
  @Roles(Role.PATIENT)
  @Get('me/prescriptions')
  findAllForPatient(@Query() query: QueryPrescriptionsDto, @CurrentUser() user: User) {
    return this.prescriptionsService.findAllForPatient(query, user);
  }

  // Admin: list all prescriptions
  @Roles(Role.ADMIN)
  @Get('admin/prescriptions')
  findAllForAdmin(@Query() query: QueryPrescriptionsDto) {
    return this.prescriptionsService.findAllForAdmin(query);
  }

  // Doctor/Patient/Admin: get prescription by id
  @Roles(Role.DOCTOR, Role.PATIENT, Role.ADMIN)
  @Get('prescriptions/:id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    await this.prescriptionsService.assertFullAccess(id, user);
    return this.prescriptionsService.findOne(id, user);
  }

  // Patient: mark as consumed
  @Roles(Role.PATIENT)
  @Put('prescriptions/:id/consume')
  consume(@Param('id') id: string, @CurrentUser() user: User) {
    return this.prescriptionsService.consume(id, user);
  }

  // Doctor/Patient/Admin: download PDF
  @Roles(Role.DOCTOR, Role.PATIENT, Role.ADMIN)
  @Get('prescriptions/:id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    await this.prescriptionsService.assertFullAccess(id, user);
    const prescription = await this.prescriptionsService.findOneForPdf(id, user);
    const appOrigin = this.config.get<string>('APP_ORIGIN') || 'http://localhost:3000';
    await this.pdfService.generatePrescriptionPdf(prescription as any, res, appOrigin);
  }
}
