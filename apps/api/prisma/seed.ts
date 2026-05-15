import { PrismaClient, Role, PrescriptionStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean slate
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const [adminPwd, drPwd, patientPwd] = await Promise.all([
    argon2.hash('admin123'),
    argon2.hash('dr123'),
    argon2.hash('patient123'),
  ]);

  // Admin
  await prisma.user.create({
    data: { email: 'admin@test.com', password: adminPwd, name: 'Admin User', role: Role.ADMIN },
  });

  // Doctor
  const drUser = await prisma.user.create({
    data: {
      email: 'dr@test.com',
      password: drPwd,
      name: 'Dr. Juan García',
      role: Role.DOCTOR,
      doctor: { create: { specialty: 'Medicina General', licenseNumber: 'MP-12345' } },
    },
    include: { doctor: true },
  });

  // Patient
  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@test.com',
      password: patientPwd,
      name: 'María López',
      role: Role.PATIENT,
      patient: {
        create: { dateOfBirth: new Date('1990-05-15'), phone: '+54 11 1234-5678' },
      },
    },
    include: { patient: true },
  });

  // Extra doctor and patients for richer seed
  const drUser2 = await prisma.user.create({
    data: {
      email: 'dr2@test.com',
      password: drPwd,
      name: 'Dra. Ana Martínez',
      role: Role.DOCTOR,
      doctor: { create: { specialty: 'Cardiología', licenseNumber: 'MP-67890' } },
    },
    include: { doctor: true },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      email: 'patient2@test.com',
      password: patientPwd,
      name: 'Carlos Rodríguez',
      role: Role.PATIENT,
      patient: { create: { dateOfBirth: new Date('1985-03-22') } },
    },
    include: { patient: true },
  });

  const doctorId = drUser.doctor!.id;
  const doctorId2 = drUser2.doctor!.id;
  const patientId = patientUser.patient!.id;
  const patientId2 = patientUser2.patient!.id;

  // Prescriptions
  const prescriptionsData = [
    {
      code: `RX-${nanoid(8).toUpperCase()}`,
      authorId: doctorId,
      patientId,
      status: PrescriptionStatus.PENDING,
      notes: 'Tomar con abundante agua. Evitar exposición solar.',
      items: [
        { name: 'Amoxicilina', dosage: '500mg', quantity: '21 comprimidos', instructions: 'Tomar 1 cada 8 horas por 7 días' },
        { name: 'Ibuprofeno', dosage: '400mg', quantity: '10 comprimidos', instructions: 'Tomar 1 cada 12 horas si hay dolor' },
      ],
    },
    {
      code: `RX-${nanoid(8).toUpperCase()}`,
      authorId: doctorId,
      patientId,
      status: PrescriptionStatus.CONSUMED,
      notes: 'Control en 30 días.',
      items: [
        { name: 'Enalapril', dosage: '10mg', quantity: '30 comprimidos', instructions: 'Tomar 1 por día en ayunas' },
      ],
    },
    {
      code: `RX-${nanoid(8).toUpperCase()}`,
      authorId: doctorId2,
      patientId,
      status: PrescriptionStatus.PENDING,
      notes: 'Dieta baja en sodio.',
      items: [
        { name: 'Losartán', dosage: '50mg', quantity: '30 comprimidos', instructions: 'Tomar 1 por día' },
        { name: 'Amlodipina', dosage: '5mg', quantity: '30 comprimidos', instructions: 'Tomar 1 por día con la cena' },
      ],
    },
    {
      code: `RX-${nanoid(8).toUpperCase()}`,
      authorId: doctorId,
      patientId: patientId2,
      status: PrescriptionStatus.PENDING,
      items: [
        { name: 'Paracetamol', dosage: '500mg', quantity: '20 comprimidos', instructions: 'Tomar 1 cada 6 horas' },
        { name: 'Vitamina C', dosage: '1g', quantity: '30 comprimidos', instructions: 'Tomar 1 por día' },
      ],
    },
    {
      code: `RX-${nanoid(8).toUpperCase()}`,
      authorId: doctorId2,
      patientId: patientId2,
      status: PrescriptionStatus.CONSUMED,
      notes: 'Recuperación satisfactoria.',
      items: [
        { name: 'Metformina', dosage: '850mg', quantity: '60 comprimidos', instructions: 'Tomar 1 con el desayuno y 1 con la cena' },
      ],
    },
    {
      code: `RX-${nanoid(8).toUpperCase()}`,
      authorId: doctorId,
      patientId,
      status: PrescriptionStatus.PENDING,
      items: [
        { name: 'Omeprazol', dosage: '20mg', quantity: '28 comprimidos', instructions: 'Tomar 1 antes del desayuno' },
        { name: 'Domperidona', dosage: '10mg', quantity: '30 comprimidos', instructions: 'Tomar 1 antes de cada comida' },
      ],
    },
    {
      code: `RX-${nanoid(8).toUpperCase()}`,
      authorId: doctorId2,
      patientId,
      status: PrescriptionStatus.CONSUMED,
      items: [
        { name: 'Azitromicina', dosage: '500mg', quantity: '3 comprimidos', instructions: 'Tomar 1 por día por 3 días' },
      ],
    },
    {
      code: `RX-${nanoid(8).toUpperCase()}`,
      authorId: doctorId,
      patientId: patientId2,
      status: PrescriptionStatus.PENDING,
      notes: 'Reposo relativo 5 días.',
      items: [
        { name: 'Cetirizina', dosage: '10mg', quantity: '20 comprimidos', instructions: 'Tomar 1 por la noche' },
        { name: 'Fluticasona spray nasal', dosage: '50mcg', quantity: '1 frasco', instructions: '2 puffs en cada fosa nasal por la mañana' },
      ],
    },
  ];

  for (const p of prescriptionsData) {
    const { items, ...prescriptionData } = p;
    await prisma.prescription.create({
      data: {
        ...prescriptionData,
        items: { create: items },
      },
    });
  }

  console.log('✅ Seed completed!');
  console.log('   admin@test.com  / admin123');
  console.log('   dr@test.com     / dr123');
  console.log('   patient@test.com / patient123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
