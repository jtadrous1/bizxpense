import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// GET /api/upload/[userId]/[filename] - Serve uploaded file
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { path } = await params;

  // Security: only allow user to access their own files
  if (path[0] !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const filepath = join(UPLOAD_DIR, ...path);
    const file = await readFile(filepath);

    // Determine content type from extension
    const ext = filepath.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
    };

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[ext || ""] || "application/octet-stream",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
