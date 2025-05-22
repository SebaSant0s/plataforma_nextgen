import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "../../../stream-chat/src";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET!;

if (!STREAM_API_KEY || !STREAM_API_SECRET) {
  console.error("❌ STREAM_API_KEY or STREAM_API_SECRET is missing! Check .env.local");
}

const client = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching messages from Stream API...");

    const userId = "default-user"; 
    if (!userId) {
      console.warn("⚠️ No user found. Returning empty response.");
      return NextResponse.json({ messages: [], token: null }, { status: 200 });
    }

    const userToken = client.createToken(userId);
    console.log("Generated Token for User:", userToken);

    let channel;
    try {
      channel = client.channel("messaging", `${userId}`, {
        members: [userId],
        created_by_id: userId,
      });

      await channel.watch();
    } catch (error) {
      console.warn("⚠️ Channel does not exist yet. Returning empty messages.");
      return NextResponse.json({ messages: [], token: userToken }, { status: 200 });
    }

    // ✅ Fetch messages including attachments (images & audio)
    const messagesResponse = await channel.query({
      messages: { limit: 50 },
    });

    console.log("✅ Messages Response from Stream API:", JSON.stringify(messagesResponse, null, 2));

    // ✅ Extract image and audio attachments from messages
    const messages = messagesResponse.messages.map((msg) => {
      const images = msg.attachments?.filter((att) => att.type === "image").map((att) => att.image_url) || [];
      const audios = msg.attachments?.filter((att) => att.type === "audio").map((att) => att.asset_url) || [];
      return {
        id: msg.id,
        text: msg.text,
        user_id: msg.user_id,
        timestamp: msg.created_at,
        images,
        audios,
      };
    });

    return NextResponse.json({ messages, token: userToken }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    return NextResponse.json({ success: false, error: "Error fetching messages" }, { status: 500 });
  }
}
