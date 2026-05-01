import { NotAcceptableException } from '@nestjs/common';
import parsePhoneNumberFromString from 'libphonenumber-js';

export const normalizePhoneNumber = (phoneNumber: string) => {
  const parsed = parsePhoneNumberFromString(phoneNumber, 'NG');

  if (!parsed || !parsed.isValid()) {
    throw new NotAcceptableException({
      message: 'Invalid phone number format.',
      success: false,
      status: 406,
    });
  }

  return parsed.number;
};

// export const generateRefCode = (): string => {
//   const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTVWXYZ0123456789', 8);

//   const code = `AT-${nanoid()}`;
//   return code;
// };

export const generateRefCode = async (): Promise<string> => {
  // Dynamic import
  const { customAlphabet } = await import('nanoid');
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTVWXYZ0123456789', 8);

  return `AT-${nanoid()}`;
};
