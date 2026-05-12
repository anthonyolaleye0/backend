import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return this.sanitize(value);
  }

  private sanitize(value: any): any {
    if (typeof value === 'string') {
      return sanitizeHtml(value, {
        allowedTags: [], // remove ALL HTML tags
        allowedAttributes: {}, // remove all attributes
      }).trim();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitizedObj: Record<string, any> = {};

      for (const key in value) {
        sanitizedObj[key] = this.sanitize(value[key]);
      }

      return sanitizedObj;
    }

    return value;
  }
}
