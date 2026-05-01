// import * as fs from 'fs';
// import * as path from 'path';
// import * as pdfPoppler from 'pdf-poppler';
// import { fromPath } from 'pdf2pic';

// export async function convertPdfToImages(filePath: string): Promise<string[]> {
//   const outputDir = path.join(process.cwd(), 'uploads', 'converted');

//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   const opts = {
//     format: 'png',
//     out_dir: outputDir,
//     out_prefix: 'page',
//     page: null, // convert all pages
//   };

//   await pdfPoppler.convert(filePath, opts);

//   const files = fs.readdirSync(outputDir);

//   return files.map((file) => path.join(outputDir, file));
// }

import * as fs from 'fs';
import * as path from 'path';
import { fromPath } from 'pdf2pic';

export async function convertPdfToImages(filePath: string): Promise<string[]> {
  const outputDir = path.join(process.cwd(), 'uploads', 'converted');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const convert = fromPath(filePath, {
    density: 100,
    saveFilename: 'page',
    savePath: outputDir,
    format: 'png',
    width: 1024,
    height: 1024,
  });

  const results: string[] = [];

  let page = 1;

  while (true) {
    try {
      const res = await convert(page);
      if (res.path) {
        results.push(res.path);
      }
      page++;
    } catch (error) {
      break; // no more pages
    }
  }

  return results;
}
