import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!token || !password) return false;
  const expected = createHash("sha256").update(password).digest("hex");
  return token === expected;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) {
          throw new Error("Não autorizado");
        }
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-msvideo",
            "video/avi",
            "video/*",
            "image/*",
            "application/pdf",
          ],
          // 2 GB max per upload
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024,
          tokenPayload: JSON.stringify({ admin: true }),
        };
      },
      onUploadCompleted: async () => {
        // nothing to do
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
