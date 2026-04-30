// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class TaxLawParserService {
//   parse(rawText: string) {
//     // 1. Pre-process: Strip repetitive Gazette headers that break sentences
//     const cleanedText = this.removeGazetteNoise(rawText);
//     const lines = cleanedText
//       .split('\n')
//       .map((l) => l.trim())
//       .filter((l) => l.length > 0);

//     const result: { chapters: Chapter[]; schedules: Schedule[] } = {
//       chapters: [],
//       schedules: [],
//     };

//     let currentChapter: Chapter | null = null;
//     let currentPart: Part | null = null;
//     let currentSection: Section | null = null;
//     let currentSchedule: Schedule | null = null;

//     for (const line of lines) {
//       // --- DETECT SCHEDULE (e.g., "Twelfth Schedule") ---
//       if (this.isScheduleHeader(line)) {
//         currentSchedule = { title: line, content: '' };
//         result.schedules.push(currentSchedule);
//         currentChapter = null; // Exit chapter mode
//         continue;
//       }

//       // --- DETECT CHAPTER (e.g., "CHAPTER TWO") ---
//       if (this.isChapter(line)) {
//         currentChapter = { title: line, parts: [] };
//         result.chapters.push(currentChapter);
//         currentSchedule = null; // Exit schedule mode
//         currentPart = null;
//         continue;
//       }

//       // --- DETECT PART (e.g., "Part I") ---
//       if (this.isPart(line) && currentChapter) {
//         currentPart = { title: line, sections: [] };
//         currentChapter.parts.push(currentPart);
//         continue;
//       }

//       // --- DETECT SECTION (e.g., "14. Benefits-in-kind") ---
//       if (this.isSection(line)) {
//         const { number, title } = this.extractSection(line);
//         currentSection = { number, title, content: '', subSections: [] };

//         // Ensure section has a parent Part
//         if (!currentPart) {
//           currentPart = { title: 'General', sections: [] };
//           if (currentChapter) currentChapter.parts.push(currentPart);
//         }
//         currentPart.sections.push(currentSection);
//         continue;
//       }

//       // --- DETECT SUBSECTION (e.g., "(1) Where...") ---
//       if (this.isSubSection(line) && currentSection) {
//         const { number, content } = this.extractSubSection(line);
//         currentSection.subSections.push({ number, content });
//         continue;
//       }

//       // --- ACCUMULATE CONTENT ---
//       if (currentSchedule) {
//         currentSchedule.content += ' ' + line;
//       } else if (currentSection) {
//         // If there's no subsection yet, add to main section content
//         if (currentSection.subSections.length === 0) {
//           currentSection.content += ' ' + line;
//         } else {
//           // Append to the last detected subsection
//           const lastSub =
//             currentSection.subSections[currentSection.subSections.length - 1];
//           lastSub.content += ' ' + line;
//         }
//       }
//     }

//     return result;
//   }

//   private removeGazetteNoise(text: string): string {
//     // Removes page numbers like "A 571" and repeating Gazette titles
//     return text
//       .replace(/Nigeria Tax Act, 2025/g, '')
//       .replace(/2025 No\. 7/g, '')
//       .replace(/A\s+\d+/g, '')
//       .replace(/Official Gazette/gi, '')
//       .replace(/\s+/g, ' '); // Normalize spaces
//   }

//   private isChapter(line: string) {
//     return /^CHAPTER\s+[A-Z]+/i.test(line);
//   }

//   private isPart(line: string) {
//     return /^PART\s+[IVXLCDM]+/i.test(line);
//   }

//   private isScheduleHeader(line: string) {
//     return (
//       /^[A-Z]+\s+SCHEDULE$/i.test(line) || /^\d+[a-z]+\s+Schedule/i.test(line)
//     );
//   }

//   private isSection(line: string) {
//     // Matches "14. Benefits-in-kind" but NOT table numbers like "21"
//     return /^\d+\.\s+[A-Z]/.test(line);
//   }

//   private extractSection(line: string) {
//     const match = line.match(/^(\d+)\.\s+(.*)/);
//     return {
//       number: match ? parseInt(match[1]) : 0,
//       title: match ? match[2].trim() : line,
//     };
//   }

//   private isSubSection(line: string) {
//     return /^\(\d+\)/.test(line) || /^\([a-z]\)/i.test(line);
//   }

//   private extractSubSection(line: string) {
//     const match = line.match(/^(\([\d\w]+\))\s*(.*)/);
//     return {
//       number: match ? match[1] : '',
//       content: match ? match[2].trim() : line,
//     };
//   }
// }

////////////////////////////////////////////////////////////////////////////////////////////

import { Injectable } from '@nestjs/common';

interface SubSection {
  number: string;
  content: string;
}

interface Section {
  number: number;
  title: string;
  content: string;
  subSections: SubSection[];
}

interface Part {
  title: string;
  sections: Section[];
}

interface Chapter {
  title: string;
  parts: Part[];
}

interface Schedule {
  title: string;
  content: string;
}

// @Injectable()
// export class TaxLawParserService {
//   parse(rawText: string) {
//     // 1. Extract Metadata FIRST before cleaning the text
//     const metadata = this.extractMetadata(rawText);

//     // 2. Clean text for the loop
//     const cleanedText = this.removeGazetteNoise(rawText);
//     const lines = cleanedText
//       .split('\n')
//       .map((l) => l.trim())
//       .filter((l) => l.length > 0);

//     const result: {
//       title: string;
//       year: number;
//       description: string;
//       chapters: Chapter[];
//       schedules: Schedule[];
//     } = {
//       title: metadata.title,
//       year: metadata.year,
//       description: metadata.description,
//       chapters: [],
//       schedules: [],
//     };

//     const currentChapter: Chapter | null = null;
//     const currentPart: Part | null = null;
//     const currentSection: Section | null = null;
//     const currentSchedule: Schedule | null = null;

//     for (const line of lines) {
//       // ... (Rest of your existing loop logic for Chapters, Parts, Sections)
//       // Make sure inside your Section logic you use sec.subsections (plural)
//       // to match your repository's 'for (const sub of sec.subsections || [])'
//     }

//     return result;
//   }

//   private extractMetadata(text: string) {
//     // Look for the Law Title (usually uppercase at the top)
//     const titleMatch = text.match(/NIGERIA TAX ACT,?\s+(\d{4})/i);

//     // Look for the long description (The "An Act to..." part)
//     // It usually starts after the year and ends before the first Chapter
//     const descriptionMatch = text.match(
//       /An Act to([\s\S]*?)(?=CHAPTER|PART|Section 1)/i,
//     );

//     return {
//       title: titleMatch ? titleMatch[0].trim() : 'Nigeria Tax Act',
//       year: titleMatch ? parseInt(titleMatch[1]) : 2025,
//       description: descriptionMatch
//         ? descriptionMatch[0].replace(/\n/g, ' ').trim()
//         : 'Legislation relating to the taxation of income, transactions and instruments.',
//     };
//   }

//   private removeGazetteNoise(text: string): string {
//     // We only remove the page-level noise, NOT the core law content
//     return (
//       text
//         .replace(/Nigeria Tax Act, 2025/g, '')
//         .replace(/2025 No\. 7/g, '')
//         .replace(/A\s+\d+/g, '') // Removes A 571, A 572, etc.
//         .replace(/Official Gazette/gi, '')
//         // Don't remove 'Threshold' or 'Sunset' globally here
//         // as they might be part of the legal definitions elsewhere
//         .trim()
//     );
//   }
// }

//////////////////////////////////////////////////////////

@Injectable()
export class TaxLawParserService {
  // parse(rawText: string) {
  //   const titleMatch = rawText.match(/NIGERIA TAX ACT,?\s+(\d{4})/i);

  //   const result = {
  //     title: titleMatch ? titleMatch[0].trim() : 'Nigeria Tax Act 2025',
  //     year: titleMatch ? parseInt(titleMatch[1]) : 2025,
  //     description:
  //       'An Act to provide for the taxation of income, transactions and instruments.',
  //     chapters: [] as any[],
  //     schedules: [] as any[],
  //   };

  //   const lines = rawText
  //     .split('\n')
  //     .map((line) => line.trim())
  //     .filter((line) => line.length > 0 && !line.match(/2025 No\. 7|A\s+\d+/));

  //   let currentChapter: any = null;
  //   let currentPart: any = null;
  //   let currentSection: any = null;
  //   let currentSchedule: any = null;

  //   for (const line of lines) {
  //     // --- SCHEDULE DETECTION ---
  //     if (line.match(/Schedule$/i) && line.length < 40) {
  //       currentSchedule = {
  //         title: line,
  //         number: result.schedules.length + 1,
  //         content: '',
  //       };
  //       result.schedules.push(currentSchedule);
  //       currentChapter = null;
  //       continue;
  //     }

  //     // --- CHAPTER DETECTION ---
  //     if (line.startsWith('CHAPTER')) {
  //       currentChapter = {
  //         title: line,
  //         number: result.chapters.length + 1,
  //         parts: [],
  //       };
  //       result.chapters.push(currentChapter);
  //       currentSchedule = null;
  //       currentPart = null;
  //       continue;
  //     }

  //     // --- PART DETECTION ---
  //     if (line.startsWith('PART')) {
  //       if (!currentChapter) {
  //         currentChapter = { title: 'General', number: 1, parts: [] };
  //         result.chapters.push(currentChapter);
  //       }
  //       currentPart = {
  //         title: line,
  //         number: currentChapter.parts.length + 1,
  //         sections: [],
  //       };
  //       currentChapter.parts.push(currentPart);
  //       continue;
  //     }

  //     // --- SECTION DETECTION (e.g. "14. Benefits-in-kind") ---
  //     const sectionMatch = line.match(/^(\d+)\.\s+(.*)/);
  //     if (sectionMatch && !currentSchedule) {
  //       currentSection = {
  //         number: parseInt(sectionMatch[1]),
  //         title: sectionMatch[2].trim(),
  //         content: '',
  //         subsections: [],
  //       };

  //       if (!currentChapter) {
  //         currentChapter = { title: 'Provisions', number: 1, parts: [] };
  //         result.chapters.push(currentChapter);
  //       }
  //       if (!currentPart) {
  //         currentPart = { title: 'Part I', number: 1, sections: [] };
  //         currentChapter.parts.push(currentPart);
  //       }

  //       currentPart.sections.push(currentSection);
  //       continue;
  //     }

  //     // --- SUBSECTION DETECTION (The Fix) ---
  //     const subMatch = line.match(/^(\([\d\w]+\))\s*(.*)/);
  //     if (subMatch && currentSection) {
  //       currentSection.subsections.push({
  //         number: subMatch[1],
  //         content: subMatch[2].trim(),
  //       });
  //       continue;
  //     }

  //     // --- CONTENT ACCUMULATION ---
  //     if (currentSchedule) {
  //       currentSchedule.content += ' ' + line;
  //     } else if (currentSection) {
  //       if (currentSection.subsections.length > 0) {
  //         currentSection.subsections[
  //           currentSection.subsections.length - 1
  //         ].content += ' ' + line;
  //       } else {
  //         currentSection.content += ' ' + line;
  //       }
  //     }
  //   }

  //   return result;
  // }

  parse(rawText: string) {
    // 1. Identify the Act Metadata
    const titleMatch = rawText.match(/NIGERIA TAX ACT,?\s+(\d{4})/i);
    const result = {
      title: titleMatch ? titleMatch[0].trim() : 'Nigeria Tax Act 2025',
      year: titleMatch ? parseInt(titleMatch[1]) : 2025,
      description:
        'An Act to provide for the taxation of income, transactions and instruments.',
      chapters: [] as any[],
      schedules: [] as any[],
    };

    // 2. Filter lines properly
    // We remove GAZETTE noise specifically so they don't trigger "Section" detection
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => {
        const isNoise = line.match(
          /2025 No\. 7|A\s+\d+|Official Gazette|ARRANGEMENT OF SECTIONS/i,
        );
        const isHeaderRepeated = line === result.title;
        return line.length > 0 && !isNoise && !isHeaderRepeated;
      });

    let currentChapter: any = null;
    let currentPart: any = null;
    let currentSection: any = null;
    let currentSchedule: any = null;

    for (const line of lines) {
      // --- SCHEDULE DETECTION ---
      // The 2025 Act uses "First Schedule", "Second Schedule"
      if (line.match(/Schedule$/i) && line.length < 50) {
        currentSchedule = {
          title: line,
          number: result.schedules.length + 1,
          content: '',
        };
        result.schedules.push(currentSchedule);
        currentChapter = null; // Exit Chapter mode
        continue;
      }

      // --- CHAPTER DETECTION ---
      // Format: "CHAPTER TWO-TAXATION OF INCOME"
      if (line.match(/^CHAPTER/i)) {
        currentChapter = {
          title: line,
          number: result.chapters.length + 1,
          parts: [],
        };
        result.chapters.push(currentChapter);
        currentPart = null;
        currentSchedule = null;
        continue;
      }
      // if (line.toUpperCase().startsWith('CHAPTER')) {
      //   currentChapter = {
      //     title: line,
      //     number: result.chapters.length + 1,
      //     parts: [],
      //   };
      //   result.chapters.push(currentChapter);
      //   currentPart = null;
      //   currentSchedule = null;
      //   continue;
      // }

      // --- PART DETECTION ---
      // Format: "Part II-Taxation of Resident Persons"
      if (line.match(/^PART/i)) {
        if (!currentChapter) {
          currentChapter = { title: 'General', number: 1, parts: [] };
          result.chapters.push(currentChapter);
        }
        currentPart = {
          title: line,
          number: currentChapter.parts.length + 1,
          sections: [],
        };
        currentChapter.parts.push(currentPart);
        continue;
      }

      // if (line.toUpperCase().startsWith('PART')) {
      //   if (!currentChapter) {
      //     currentChapter = { title: 'General', number: 1, parts: [] };
      //     result.chapters.push(currentChapter);
      //   }
      //   currentPart = {
      //     title: line,
      //     number: currentChapter.parts.length + 1,
      //     sections: [],
      //   };
      //   currentChapter.parts.push(currentPart);
      //   continue;
      // }

      // --- SECTION DETECTION ---
      // Format: "4. Income, profits or gains..."
      // const sectionMatch = line.match(/^(\d+)\.\s+(.*)/);
      // const sectionMatch = line.match(/^(\d+)\.\s+([^\(]+)/);
      const sectionMatch = line.match(/^(\d+)\.\s+(.*)/);

      if (sectionMatch && !currentSchedule) {
        const sectionTitle = sectionMatch[2].trim();

        currentSection = {
          number: parseInt(sectionMatch[1]),
          title: sectionTitle,
          content: '',
          subsections: [],
        };

        // AUTO-RECOVERY: If the PDF starts with sections before a Chapter/Part
        if (!currentChapter) {
          currentChapter = { title: 'Preliminary', number: 1, parts: [] };
          result.chapters.push(currentChapter);
        }
        if (!currentPart) {
          currentPart = { title: 'General', number: 1, sections: [] };
          currentChapter.parts.push(currentPart);
        }

        currentPart.sections.push(currentSection);
        continue;
      }

      // --- SUBSECTION DETECTION ---
      // Format: "(1) Where a person..." or "(a) dividends..."
      const subMatch = line.match(/^(\([\d\w]+\))\s*(.*)/);
      if (subMatch && currentSection) {
        currentSection.subsections.push({
          number: subMatch[1],
          content: subMatch[2].trim(),
        });
        continue;
      }

      // --- CONTENT ACCUMULATION ---
      if (currentSchedule) {
        currentSchedule.content += ' ' + line;
      } else if (currentSection) {
        if (currentSection.subsections.length > 0) {
          const lastSub =
            currentSection.subsections[currentSection.subsections.length - 1];
          lastSub.content += ' ' + line;
        } else {
          currentSection.content += ' ' + line;
        }
      }
    }

    return result;
  }
}
