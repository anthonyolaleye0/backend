import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createWorker, Worker } from 'tesseract.js';

@Injectable()
export class OcrService implements OnModuleInit, OnModuleDestroy {
  private worker!: Worker;

  async onModuleInit() {
    this.worker = await createWorker('eng', 1, {
      logger: (m) => console.log(m),
    });
  }

  async extractTextFromImage(buffer: Buffer): Promise<string> {
    const result = await this.worker.recognize(buffer);
    return result.data.text;
  }

  async onModuleDestroy() {
    await this.worker.terminate();
  }
}
