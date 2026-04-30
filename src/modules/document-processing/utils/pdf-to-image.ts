import * as fs from 'fs';
import * as path from 'path';
import * as pdfPoppler from 'pdf-poppler';

export async function convertPdfToImages(filePath: string): Promise<string[]> {
  const outputDir = path.join(process.cwd(), 'uploads', 'converted');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const opts = {
    format: 'png',
    out_dir: outputDir,
    out_prefix: 'page',
    page: null, // convert all pages
  };

  await pdfPoppler.convert(filePath, opts);

  const files = fs.readdirSync(outputDir);

  return files.map((file) => path.join(outputDir, file));
}
