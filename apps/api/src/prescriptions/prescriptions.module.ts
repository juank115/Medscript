import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PdfService } from './pdf.service';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PdfService],
})
export class PrescriptionsModule {}
