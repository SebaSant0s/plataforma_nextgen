import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function isValidApiKey(key: string): Promise<boolean> {
  const result = await prisma.chat_api_keys.findUnique({
    where: { api_key: key },
  });
  
  return !!result;
}
