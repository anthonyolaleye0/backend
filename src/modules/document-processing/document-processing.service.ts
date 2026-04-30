import { Injectable } from '@nestjs/common';
import fs from 'fs';
import { CleanerService } from './services/cleaner.service';
import { OcrService } from './services/ocr.service';
import { PdfService } from './services/pdf.service';
import { convertPdfToImages } from './utils/pdf-to-image';

@Injectable()
export class DocumentProcessingService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly ocrService: OcrService,
    private readonly cleanerService: CleanerService,
  ) {}

  async process(file: Express.Multer.File): Promise<string> {
    if (!file.mimetype.includes('pdf')) {
      throw new Error('Only PDF files are allowed');
    }

    let text = await this.pdfService.extractText(file);

    if (!text || text.trim().length < 100) {
      const images = await convertPdfToImages(file.path);

      let ocrText = '';

      try {
        for (const img of images) {
          const buffer = fs.readFileSync(img);
          ocrText += await this.ocrService.extractTextFromImage(buffer);
        }
      } finally {
        for (const img of images) {
          if (fs.existsSync(img)) {
            fs.unlinkSync(img);
          }
        }
      }

      text = ocrText;
    }

    text = this.cleanerService.clean(text);

    return text;
  }
}
