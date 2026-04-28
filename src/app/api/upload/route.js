import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "hostelhub_uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (5MB max)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    // Upload to Cloudinary
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: "auto",
            public_id: `file_${Date.now()}`,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });

      return NextResponse.json({ 
        url: uploadResult.secure_url, 
        filename: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes
      });
      
    } catch (uploadError) {
      console.error("Cloudinary uploader failed:", uploadError);
      return NextResponse.json(
        { error: "Cloudinary upload failed: " + uploadError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Internal Upload Error:", error);
    return NextResponse.json(
      { error: "Upload process failed" },
      { status: 500 }
    );
  }
}
