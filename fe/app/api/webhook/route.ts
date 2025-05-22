import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "../../../stream-chat/src";
import { writeFile } from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import fs from "fs";

import { currentUser, User, getAuth} from '@clerk/nextjs/server'

import { XCircle, Bot } from "lucide-react";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; // Example: "https://yourdomain.com"
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

if (!STREAM_API_KEY || !STREAM_API_SECRET) {
  console.error("❌ STREAM_API_KEY or STREAM_API_SECRET is missing! Check .env.local");
}

const client = StreamChat.getInstance(STREAM_API_KEY!, STREAM_API_SECRET!);

const getUserData = (): any => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'userdata.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('❌ Error reading user data:', error);
    return null;
  }
};

/**
 * ✅ Function to Download File from URL and Save Locally
 * @param {string} fileUrl - The URL of the file to download
 * @param {string} fileType - The type of the file (image, audio, etc.)
 * @returns {Promise<string>} - The accessible URL of the saved file
 */
async function downloadAndSaveFile(fileUrl: string, fileType: string): Promise<string> {
  try {
    console.log(`Downloading ${fileType} from:`, fileUrl);

    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) throw new Error(`Failed to download ${fileType}: ${response.statusText}`);

    const buffer = Buffer.from(await response.arrayBuffer());

    // ✅ Define directory based on file type
    const uploadDir = fileType === "image"
      ? path.resolve("uploads/image")
      : path.resolve("uploads/audio");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
      console.log(`✅ Created missing ${fileType} directory with full permissions.`);
    }

    // ✅ Generate a unique filename
    const fileExtension = fileType === "image" ? "jpg" : "mp3";
    const fileName = `${Date.now()}-${fileType}.${fileExtension}`;
    const filePath = path.resolve(uploadDir, fileName);

    await fs.promises.writeFile(filePath, buffer, { mode: 0o666 });

    console.log(`✅ ${fileType.charAt(0).toUpperCase() + fileType.slice(1)} saved successfully at: ${filePath}`);

    // ✅ Return dynamic API URL for accessing the file
    return `${BASE_URL}/api/uploads/${fileType}/${fileName}`;
  } catch (error) {
    console.error(`❌ Error downloading ${fileType}:`, error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Received request:", req.method, req.headers.get("content-type"));

    // ✅ Read the request body
    const body = await req.json();
    console.log("Parsed body:", body);

    const { chat_name, chat_member, message_id, user_name, user_phone_number, message, timestamp, image_url, audio_url } = body;

    if (!STREAM_API_KEY) {
      return NextResponse.json({ success: false, error: "Missing Stream API Key" }, { status: 500 });
    }

    if (!message_id || !user_phone_number) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const userData = getUserData()

    console.log(userData)

    console.log("Checking if users exist...");

    // ✅ List of users that need to exist in StreamChat
    const requiredUsers = [
      { id: chat_member, name: chat_name },
      { id: "5491140897287", name: "NextGen AI", image: "https://hugely-prime-seahorse.ngrok-free.app/profile/agent-profile.svg" },  // Ensure this user is created
      { id: userData.id , name: "Optiland", image: userData.image}
    ];

    try {
      // ✅ Ensure all required users exist in StreamChat
      await client.upsertUsers(requiredUsers);
      console.log("✅ Users ensured in StreamChat:", requiredUsers);
    } catch (error) {
      console.error("❌ Error creating users:", error);
      return NextResponse.json({ success: false, error: "Error creating users in StreamChat" }, { status: 500 });
    }

    console.log("Checking if channel exists...");

    const channelId = `${chat_member}`;

    
    const channel = client.channel("messaging", channelId, {
      name: `${chat_name}`,
      members: requiredUsers.map(user => user.id), // ✅ Use the IDs of the created users
      created_by: { id: chat_member, name: chat_name },
    });

    await channel.create();
    console.log("✅ Channel created or already exists!");
    

    // ✅ Download and save the image/audio dynamically
    let savedImageUrl = image_url ? await downloadAndSaveFile(image_url, "image") : null;
    let savedAudioUrl = audio_url ? await downloadAndSaveFile(audio_url, "audio") : null;

    // ✅ Prepare attachments array
    const attachments = [];
    if (savedImageUrl) {
      attachments.push({ type: "image", image_url: savedImageUrl });
    }
    if (savedAudioUrl) {
      attachments.push({ type: "audio", asset_url: savedAudioUrl });
    }

    // ✅ Ensure text message is sent even if no attachments
    const messagePayload: any = {
      id: message_id,
      text: message || "", // Ensure there's always a text value
      user_id: user_phone_number,
    };

    // ✅ Only include attachments if they exist
    if (attachments.length > 0) {
      messagePayload.attachments = attachments;
    }

    // ✅ Send message to StreamChat
    await channel.sendMessage(messagePayload);
    console.log("✅ Message sent successfully:", messagePayload);

    return NextResponse.json({ success: true, message: "Message synced to Stream API" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error syncing message:", error);
    return NextResponse.json({ success: false, error: "Error syncing message" }, { status: 500 });
  }
}

