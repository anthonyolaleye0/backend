import { Injectable } from '@nestjs/common';

@Injectable()
export class CleanerService {
  clean(text: string): string {
    if (!text) return '';

    return (
      text
        // 1. Fix common OCR mistakes
        .replace(/SECTlON/gi, 'SECTION')
        .replace(/Sectlon/gi, 'Section')

        // 2. Fix broken lines (hyphenated words at end of lines)
        .replace(/-\s+/g, '')

        // 3. Normalize horizontal whitespace ONLY (Keep \n)
        // [ \t]+ matches spaces and tabs but ignores newlines
        .replace(/[ \t]+/g, ' ')

        // 4. Normalize multiple newlines into a single newline
        .replace(/\n{2,}/g, '\n')

        .trim()
    );
  }
}
