import { BadRequestException, Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';

@Injectable()
export class PdfService {
  async extractText(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // const buffer = fs.readFileSync(file.path);
      const buffer = file.buffer;
      const data = await pdfParse(buffer);

      return data.text || '';
    } catch (error) {
      console.log('catched error:', error);
      throw new BadRequestException('Invalid or corrupted PDF file');
    }
  }
}
