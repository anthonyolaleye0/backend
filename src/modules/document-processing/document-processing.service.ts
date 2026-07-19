import { Injectable } from '@nestjs/common';
import fs from 'fs';
import * as libre from 'libreoffice-convert';
import * as mammoth from 'mammoth';
import { promisify } from 'util';
import { CleanerService } from './services/cleaner.service';
import { OcrService } from './services/ocr.service';
import { PdfService } from './services/pdf.service';
import { convertPdfToImages } from './utils/pdf-to-image';

const libreConvert = promisify(libre.convert);

@Injectable()
export class DocumentProcessingService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly ocrService: OcrService,
    private readonly cleanerService: CleanerService,
  ) {}

  async process(file: Express.Multer.File): Promise<string> {
    console.log('FILE DEBUG:', {
      mimeType: file.mimetype,
      hasBuffer: !!file.buffer,
      hasPath: !!file.path,
    });
    let text = '';

    const mimeType = file.mimetype;

    // ================================
    // 1. HANDLE PDF
    // ================================
    if (mimeType === 'application/pdf') {
      text = await this.pdfService.extractText(file);

      // Fallback to OCR if PDF has little/no text
      if (!text || text.trim().length < 100) {
        const images = await convertPdfToImages(file.path);
        // const tempPdfPath = `./tmp-${Date.now()}.pdf`;
        // fs.writeFileSync(tempPdfPath, file.buffer);

        // const images = await convertPdfToImages(tempPdfPath);

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
    }

    // ================================
    // 2. HANDLE DOCX
    // ================================
    else if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await this.extractDocxTextFromPath(file.path);
    }

    // ================================
    // 3. HANDLE DOC (LEGACY)
    // ================================
    else if (mimeType === 'application/msword') {
      text = await this.extractDocxTextFromPath(file.path);
    }

    // ================================
    // 4. UNSUPPORTED TYPE
    // ================================
    else {
      throw new Error('Unsupported file type');
    }

    // ================================
    // 5. CLEAN TEXT
    // ================================
    text = this.cleanerService.clean(text);

    return text;
  }

  private async extractDocxTextFromPath(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  private async extractDocTextFromPath(filePath: string): Promise<string> {
    const docBuffer = fs.readFileSync(filePath);

    const docxBuffer = await libreConvert(docBuffer, '.docx', undefined);

    const tempPath = filePath + '.docx';
    fs.writeFileSync(tempPath, docxBuffer);

    try {
      const result = await mammoth.extractRawText({ path: tempPath });
      return result.value || '';
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  private async extractDocxTextFromBuffer(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  private async extractDocText(buffer: Buffer): Promise<string> {
    // Convert DOC → DOCX
    const docxBuffer = await libreConvert(buffer, '.docx', undefined);

    return this.extractDocxTextFromBuffer(docxBuffer);
  }

  // private async extractDocText(filePath: string): Promise<string> {
  //   const docBuffer = fs.readFileSync(filePath);

  //   // Convert DOC → DOCX
  //   const docxBuffer = await libreConvert(docBuffer, '.docx', undefined);

  //   const tempPath = filePath + '.docx';
  //   fs.writeFileSync(tempPath, docxBuffer);

  //   try {
  //     return await this.extractDocxText(tempPath);
  //   } finally {
  //     if (fs.existsSync(tempPath)) {
  //       fs.unlinkSync(tempPath);
  //     }
  //   }
  // }
}
