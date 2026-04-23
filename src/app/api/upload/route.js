import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { adminStorage } from "@/lib/admin-firebase";

export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (5MB max)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Generate unique filename
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;

    // Try Firebase Storage first (for production/live site)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_STORAGE_BUCKET) {
      try {
        const bucket = adminStorage.bucket();
        const fileRef = bucket.file(`${folder}/${filename}`);
        
        await fileRef.save(buffer, {
          metadata: {
            contentType: file.type,
          },
        });

        // Make the file public or get a signed URL
        // For simplicity in this protocol, we use the public URL format
        // Note: The bucket should be configured for public read if using this format
        const url = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(`${folder}/${filename}`)}?alt=media`;
        
        return NextResponse.json({ url, filename });
      } catch (fbError) {
        console.error("Firebase upload failed, falling back to local:", fbError);
        // Fall through to local upload if Firebase fails but we're in dev
      }
    }

    // Fallback to Local Storage (only works in local dev environments)
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      
      const url = `/uploads/${folder}/${filename}`;
      return NextResponse.json({ url, filename });
    } catch (fsError) {
      console.error("Local filesystem upload failed:", fsError);
      throw new Error("Cloud storage not configured and local upload failed.");
    }

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
