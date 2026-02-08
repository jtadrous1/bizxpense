import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

// POST /api/upload - Upload receipt file
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const expenseId = formData.get("expenseId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Use JPEG, PNG, GIF, WebP, or PDF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB." },
        { status: 400 }
      );
    }

    // Create user-specific directory
    const userDir = join(UPLOAD_DIR, user.id);
    await mkdir(userDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 100);
    const filename = `${timestamp}-${safeName}`;
    const filepath = join(userDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Relative path for storage
    const relativePath = `${user.id}/${filename}`;

    // If expenseId provided, link receipt to expense
    if (expenseId) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: {
          receiptPath: relativePath,
          receiptName: file.name,
        },
      });
    }

    return NextResponse.json({
      path: relativePath,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
