import { BadRequestException, Injectable } from '@nestjs/common';
import fs from 'fs';
import pdfParse from 'pdf-parse';

@Injectable()
export class PdfService {
  // async extractText(file: Express.Multer.File): Promise<string> {
  //   console.log('PDF DEBUG:', {
  //     size: file.buffer.length,
  //     firstBytes: file.buffer.slice(0, 5),
  //   });
  //   if (!file || !file.buffer) {
  //     throw new BadRequestException('No file uploaded');
  //   }

  //   try {
  //     // const buffer = fs.readFileSync(file.path);
  //     const buffer = file.buffer;
  //     const data = await pdfParse(buffer);

  //     return data.text || '';
  //   } catch (error) {
  //     console.log('catched error:', error);
  //     throw new BadRequestException('Invalid or corrupted PDF file');
  //   }
  // }

  async extractText(file: Express.Multer.File): Promise<string> {
    if (!file || !file.path) {
      throw new BadRequestException('File path is missing');
    }

    try {
      const buffer = fs.readFileSync(file.path);

      console.log('PDF DEBUG:', {
        size: buffer.length,
        firstBytes: buffer.slice(0, 5),
      });

      const data = await pdfParse(buffer);

      return data.text || '';
    } catch (error) {
      console.log('catched error:', error);
      throw new BadRequestException('Invalid or corrupted PDF file');
    }
  }
}
