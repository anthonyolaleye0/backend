export const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];

  console.log('value:', value);

  if (!value) {
    throw new Error(`${key} is not defined in environment variables.`);
  }

  return value;
};
