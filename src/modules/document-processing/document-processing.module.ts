import { Module } from '@nestjs/common';
import { DocumentProcessingController } from './document-processing.controller';
import { DocumentProcessingService } from './document-processing.service';
import { CleanerService } from './services/cleaner.service';
import { OcrService } from './services/ocr.service';
import { PdfService } from './services/pdf.service';

@Module({
  providers: [
    DocumentProcessingService,
    PdfService,
    OcrService,
    CleanerService,
  ],
  controllers: [DocumentProcessingController],
  exports: [DocumentProcessingService],
})
export class DocumentProcessingModule {}
