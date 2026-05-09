import { z } from "zod";

import { uploadFilesToSwarm, type SwarmUploadDescriptor } from "@/lib/swarm/server";

export const runtime = "nodejs";

const UploadDescriptorSchema = z.object({
  clientId: z.string().trim().min(1).optional(),
  role: z.enum(["source", "preview", "other"]).optional(),
  expectedReference: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{64}$/)
    .optional()
    .nullable(),
  sha256: z.string().trim().min(1).optional().nullable(),
  filePath: z.string().trim().min(1).optional().nullable(),
  createdAt: z.string().trim().min(1).optional().nullable(),
  updatedAt: z.string().trim().min(1).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter(isFile);

    if (files.length === 0) {
      return Response.json(
        { error: "At least one file is required for Swarm upload." },
        { status: 400 },
      );
    }

    const descriptorValue = formData.get("descriptors");
    const descriptors = parseDescriptors(descriptorValue);
    const uploads = await uploadFilesToSwarm(files, descriptors);

    return Response.json({
      uploads,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The files could not be uploaded to Swarm.",
      },
      { status: 500 },
    );
  }
}

function parseDescriptors(value: FormDataEntryValue | null): SwarmUploadDescriptor[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("The Swarm upload descriptors must be a JSON array.");
  }

  return parsed.map((item) => UploadDescriptorSchema.parse(item));
}

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0;
}
