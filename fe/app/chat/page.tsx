import fs from 'fs';
import path from 'path';
import { currentUser, User } from '@clerk/nextjs/server';
import StreamChat from '@/components/stream-chat';

export default async function Chat() {
  const user = (await currentUser()) as User;

  if (!user) return null;

  const userData = {
    id: user.id,
    ...(user.fullName ? { name: user.fullName } : {}),
    ...(user.imageUrl ? { image: user.imageUrl } : {}),
  };

  // ✅ Define the path to the main directory (project root)
  const filePath = path.join(process.cwd(), 'public',  'userdata.json');

  // ✅ Write the file synchronously to ensure it completes before render
  try {
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2), 'utf-8');
    console.log('✅ User data saved at', filePath);
  } catch (error) {
    console.error('❌ Failed to save user data:', error);
  }

  return <StreamChat userData={userData} />;
}
