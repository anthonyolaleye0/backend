import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NormalizeDtoPipe implements PipeTransform {
  transform(value: any) {
    return this.normalize(value);
  }

  private normalize(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed;
    }

    if (Array.isArray(value)) {
      return value
        .flatMap((v) => this.normalize(v))
        .filter((v) => v !== undefined && v !== null && v !== '');
    }

    if (typeof value === 'object') {
      const result: any = {};

      for (const [key, val] of Object.entries(value)) {
        result[key] = this.normalize(val);
      }

      return result;
    }

    return value;
  }
}
