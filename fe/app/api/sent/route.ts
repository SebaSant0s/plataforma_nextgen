import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") || formData.get("image");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file into buffer
    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate file name and save path
    const fileType = "image"; // or detect dynamically
    const uploadDir = path.resolve(`uploads/sent`);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = (file as File).name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${fileType}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save the file
    await fs.promises.writeFile(filePath, buffer);

    // Construct the public URL for accessing the file
    const fileUrl = `${BASE_URL}/api/uploads/sent/${fileName}`;

    console.log(`✅ File saved and exposed at: ${fileUrl}`);

    return NextResponse.json({ success: true, fileUrl });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 });
  }
}