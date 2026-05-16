import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { QueryPrescriptionsDto } from './dto/query-prescriptions.dto';
import { PrescriptionStatus, Role, User } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePrescriptionDto, currentUser: User) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: currentUser.id },
    });
    if (!doctor) throw new ForbiddenException('User is not a doctor');

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const code = `RX-${nanoid(8).toUpperCase()}`;

    return this.prisma.prescription.create({
      data: {
        code,
        notes: dto.notes,
        authorId: doctor.id,
        patientId: dto.patientId,
        items: {
          create: dto.items,
        },
      },
      include: {
        items: true,
        author: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
  }

  async findAllForDoctor(query: QueryPrescriptionsDto, currentUser: User) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: currentUser.id } });
    if (!doctor) throw new ForbiddenException('User is not a doctor');

    return this.paginatedQuery({ ...query, doctorId: doctor.id });
  }

  async findAllForAdmin(query: QueryPrescriptionsDto) {
    return this.paginatedQuery(query);
  }

  async findAllForPatient(query: QueryPrescriptionsDto, currentUser: User) {
    const patient = await this.prisma.patient.findUnique({ where: { userId: currentUser.id } });
    if (!patient) throw new ForbiddenException('User is not a patient');

    return this.paginatedQuery({ ...query, patientId: patient.id });
  }

  async findOne(id: string, currentUser: User) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        author: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');

    await this.assertAccess(prescription, currentUser);
    return prescription;
  }

  async consume(id: string, currentUser: User) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');

    const patient = await this.prisma.patient.findUnique({ where: { userId: currentUser.id } });
    if (!patient || prescription.patientId !== patient.id) {
      throw new ForbiddenException('Access denied');
    }

    if (prescription.status === PrescriptionStatus.CONSUMED) {
      throw new BadRequestException('Prescription already consumed');
    }

    return this.prisma.prescription.update({
      where: { id },
      data: { status: PrescriptionStatus.CONSUMED },
      include: {
        items: true,
        author: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
  }

  async findOneForPdf(id: string, currentUser: User) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        author: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');

    await this.assertAccess(prescription, currentUser);
    return prescription;
  }

  private async assertAccess(
    prescription: { authorId: string; patientId: string },
    currentUser: User,
  ) {
    if (currentUser.role === Role.ADMIN) return;

    if (currentUser.role === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: currentUser.id },
      });
      if (!doctor || prescription.authorId !== doctor.id) {
        throw new ForbiddenException('Access denied');
      }
      return;
    }

    if (currentUser.role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!patient || prescription.patientId !== patient.id) {
        throw new ForbiddenException('Access denied');
      }
      return;
    }

    throw new ForbiddenException('Access denied');
  }

  // Full ownership check used in findOne
  async assertFullAccess(id: string, currentUser: User) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new NotFoundException('Prescription not found');

    if (currentUser.role === Role.ADMIN) return prescription;

    if (currentUser.role === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: currentUser.id } });
      if (!doctor || prescription.authorId !== doctor.id) {
        throw new ForbiddenException('Access denied');
      }
      return prescription;
    }

    if (currentUser.role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId: currentUser.id } });
      if (!patient || prescription.patientId !== patient.id) {
        throw new ForbiddenException('Access denied');
      }
      return prescription;
    }

    throw new ForbiddenException('Access denied');
  }

  private async paginatedQuery(query: QueryPrescriptionsDto) {
    const page = Math.max(parseInt(query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const order = query.order || 'desc';

    const where: Record<string, unknown> = {};

    if (query.status) where.status = query.status;
    if (query.doctorId) where.authorId = query.doctorId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: order },
        include: {
          items: true,
          author: { include: { user: true } },
          patient: { include: { user: true } },
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
