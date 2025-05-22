import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const getMimeType = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "ppt":
      return "application/vnd.ms-powerpoint";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "txt":
      return "text/plain";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream"; // Default for unknown types
  }
};


export async function GET(
  req: NextRequest,
  { params }: { params: { fileType: string; filename: string } }
) {
  try {
    const { fileType, filename } = params;

    // ✅ Define the path where files are stored
    const filePath = path.resolve(`uploads/${fileType}/${filename}`);

    // ✅ Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // ✅ Read file content
    const fileBuffer = await fs.promises.readFile(filePath);

    // ✅ Dynamically determine content type from filename
    const contentType = getMimeType(filename);

    console.log(`✅ Serving file: ${filename} with content-type: ${contentType}`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // Optional: cache headers for images
      },
    });
  } catch (error) {
    console.error("❌ Error serving file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ DELETE endpoint - deletes the file
export async function DELETE(
  req: NextRequest,
  { params }: { params: { fileType: string; filename: string } }
) {
  try {
    const { fileType, filename } = params;

    if (!fileType || !filename) {
      console.error("❌ fileType or filename parameter is missing.");
      return NextResponse.json(
        { error: "fileType and filename are required" },
        { status: 400 }
      );
    }

    const filePath = path.resolve(`uploads/${fileType}/${filename}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found for deletion: ${filePath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete the file
    await fs.promises.unlink(filePath);
    console.log(`✅ File deleted: ${filePath}`);

    return NextResponse.json(
      { success: true, message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}