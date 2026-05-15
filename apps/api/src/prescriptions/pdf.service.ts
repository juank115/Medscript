import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Response } from 'express';
import { Prescription, PrescriptionItem, Doctor, Patient, User } from '@prisma/client';

type PrescriptionWithRelations = Prescription & {
  items: PrescriptionItem[];
  author: Doctor & { user: User };
  patient: Patient & { user: User };
};

@Injectable()
export class PdfService {
  async generatePrescriptionPdf(
    prescription: PrescriptionWithRelations,
    res: Response,
    appOrigin: string,
  ) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="prescription-${prescription.code}.pdf"`,
    );
    doc.pipe(res);

    // Header
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(`Prescripción ${prescription.code}`, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Fecha de emisión: ${prescription.createdAt.toLocaleDateString('es-ES')}`, {
        align: 'center',
      });
    doc.text(
      `Estado: ${prescription.status === 'PENDING' ? 'PENDIENTE' : 'CONSUMIDA'}`,
      { align: 'center' },
    );
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Doctor info
    doc.fontSize(12).font('Helvetica-Bold').text('Médico Prescriptor');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${prescription.author.user.name}`);
    if (prescription.author.specialty) {
      doc.text(`Especialidad: ${prescription.author.specialty}`);
    }
    if (prescription.author.licenseNumber) {
      doc.text(`Matrícula: ${prescription.author.licenseNumber}`);
    }
    doc.moveDown();

    // Patient info
    doc.fontSize(12).font('Helvetica-Bold').text('Datos del Paciente');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${prescription.patient.user.name}`);
    doc.text(`Email: ${prescription.patient.user.email}`);
    if (prescription.patient.dateOfBirth) {
      doc.text(
        `Fecha de nacimiento: ${prescription.patient.dateOfBirth.toLocaleDateString('es-ES')}`,
      );
    }
    doc.moveDown();

    // Items table
    doc.fontSize(12).font('Helvetica-Bold').text('Medicamentos / Indicaciones');
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const col = { name: 50, dosage: 200, qty: 320, instructions: 390 };

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Medicamento', col.name, tableTop);
    doc.text('Dosis', col.dosage, tableTop);
    doc.text('Cantidad', col.qty, tableTop);
    doc.text('Indicaciones', col.instructions, tableTop);

    doc
      .moveTo(50, tableTop + 14)
      .lineTo(545, tableTop + 14)
      .stroke();

    let rowY = tableTop + 20;
    doc.font('Helvetica').fontSize(9);

    for (const item of prescription.items) {
      doc.text(item.name, col.name, rowY, { width: 140 });
      doc.text(item.dosage || '-', col.dosage, rowY, { width: 110 });
      doc.text(item.quantity || '-', col.qty, rowY, { width: 60 });
      doc.text(item.instructions || '-', col.instructions, rowY, { width: 155 });
      rowY += 20;
    }

    doc.moveDown(2);

    // Notes
    if (prescription.notes) {
      doc.fontSize(12).font('Helvetica-Bold').text('Notas del Médico');
      doc.fontSize(10).font('Helvetica').text(prescription.notes);
      doc.moveDown();
    }

    // QR code
    try {
      const qrUrl = `${appOrigin}/patient/prescriptions/${prescription.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 100 });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

      const qrX = 445;
      const qrY = doc.page.height - 160;
      doc.image(qrBuffer, qrX, qrY, { width: 80 });
      doc
        .fontSize(7)
        .font('Helvetica')
        .text('Escanea para ver la prescripción', qrX - 10, qrY + 85, { width: 100, align: 'center' });
    } catch {
      // QR optional
    }

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(`Código: ${prescription.code}`, 50, doc.page.height - 60, {
        align: 'center',
        width: 495,
      });

    doc.end();
  }
}
