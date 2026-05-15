jest.mock('nanoid', () => ({ nanoid: () => 'TESTID12' }));

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, PrescriptionStatus } from '@prisma/client';

const mockDoctor = { id: 'doctor-1', userId: 'user-1' };
const mockPatient = { id: 'patient-1', userId: 'user-2' };
const mockUser = { id: 'user-1', role: Role.DOCTOR } as any;
const mockPatientUser = { id: 'user-2', role: Role.PATIENT } as any;

const mockPrescription = {
  id: 'rx-1',
  code: 'RX-ABCD1234',
  authorId: 'doctor-1',
  patientId: 'patient-1',
  status: PrescriptionStatus.PENDING,
  items: [],
  author: { user: { name: 'Dr Test', email: 'dr@test.com' } },
  patient: { user: { name: 'Patient', email: 'p@test.com' } },
};

const mockPrisma = {
  doctor: { findUnique: jest.fn() },
  patient: { findUnique: jest.fn() },
  prescription: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a prescription successfully', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrisma.prescription.create.mockResolvedValue(mockPrescription);

      const result = await service.create(
        { patientId: 'patient-1', items: [{ name: 'Ibuprofeno' }] },
        mockUser,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.prescription.create).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException if user is not a doctor', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ patientId: 'p1', items: [{ name: 'Med' }] }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if patient not found', async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ patientId: 'bad-id', items: [{ name: 'Med' }] }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('consume', () => {
    it('marks prescription as consumed', async () => {
      mockPrisma.prescription.findUnique
        .mockResolvedValueOnce({ ...mockPrescription, patient: mockPatient })
        .mockResolvedValue(mockPrescription);
      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrisma.prescription.update.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.CONSUMED,
      });

      const result = await service.consume('rx-1', mockPatientUser);
      expect(result.status).toBe(PrescriptionStatus.CONSUMED);
    });

    it('throws BadRequestException if already consumed', async () => {
      mockPrisma.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        status: PrescriptionStatus.CONSUMED,
        patient: mockPatient,
      });
      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);

      await expect(service.consume('rx-1', mockPatientUser)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException if patient does not own prescription', async () => {
      mockPrisma.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        patientId: 'other-patient',
        patient: { id: 'other-patient' },
      });
      mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);

      await expect(service.consume('rx-1', mockPatientUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertFullAccess', () => {
    it('allows admin to access any prescription', async () => {
      mockPrisma.prescription.findUnique.mockResolvedValue(mockPrescription);
      const adminUser = { id: 'admin-1', role: Role.ADMIN } as any;

      await expect(service.assertFullAccess('rx-1', adminUser)).resolves.toBeDefined();
    });

    it('throws ForbiddenException if doctor is not the author', async () => {
      mockPrisma.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrisma.doctor.findUnique.mockResolvedValue({ id: 'other-doctor', userId: 'user-99' });

      await expect(service.assertFullAccess('rx-1', mockUser)).rejects.toThrow(ForbiddenException);
    });
  });
});
