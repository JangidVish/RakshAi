import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Papa from "papaparse";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Bound the work per request so a huge upload can't tie up the instance.
const MAX_ROWS = 1000;

// One CSV row after header parsing. Header names are lower-cased + trimmed by
// the transformHeader below, so we accept the canonical lower-case keys here.
const rowSchema = z.object({
  name: z.string().min(1, "name is required"),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((v) => (v ? v : undefined)),
  category: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  riskTier: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine(
      (v) => v === undefined || ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(v),
      "riskTier must be LOW/MEDIUM/HIGH/CRITICAL"
    ),
  aiExposure: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v !== "" ? Number(v) : undefined))
    .refine(
      (v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 100),
      "aiExposure must be an integer 0-100"
    ),
});

// POST /api/vendors/import — bulk upsert vendors from a CSV (buyer only).
// Accepts multipart/form-data with a `file` field, or a raw text/csv body.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read the CSV text from either a multipart file or the raw body.
  let csvText: string;
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Missing `file` field" },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      csvText = await req.text();
    }
  } catch {
    return NextResponse.json({ error: "Could not read upload" }, { status: 400 });
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
  }

  // Parse with headers; normalize header names to our canonical keys.
  const headerMap: Record<string, string> = {
    name: "name",
    domain: "domain",
    category: "category",
    "risk tier": "riskTier",
    risktier: "riskTier",
    tier: "riskTier",
    "ai exposure": "aiExposure",
    aiexposure: "aiExposure",
    "ai exposure %": "aiExposure",
  };

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => {
      const key = h.trim().toLowerCase();
      return headerMap[key] ?? key;
    },
  });

  const rows = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows found" },
      { status: 400 }
    );
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS})` },
      { status: 413 }
    );
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; message: string }[] = [];

  // Process rows independently — one bad row never aborts the batch.
  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +1 for header, +1 for 1-based
    const result = rowSchema.safeParse(rows[i]);
    if (!result.success) {
      skipped++;
      errors.push({
        row: rowNum,
        message: result.error.issues.map((e) => e.message).join("; "),
      });
      continue;
    }

    const data = result.data;
    try {
      if (data.domain) {
        // Deterministic upsert on the unique domain.
        const existing = await prisma.vendor.findUnique({
          where: { domain: data.domain },
        });
        if (existing) {
          await prisma.vendor.update({
            where: { domain: data.domain },
            data: {
              name: data.name,
              category: data.category,
              ...(data.riskTier ? { riskTier: data.riskTier as any } : {}),
              ...(data.aiExposure !== undefined
                ? { aiExposure: data.aiExposure }
                : {}),
            },
          });
          updated++;
        } else {
          await prisma.vendor.create({
            data: {
              name: data.name,
              domain: data.domain,
              category: data.category,
              ...(data.riskTier ? { riskTier: data.riskTier as any } : {}),
              ...(data.aiExposure !== undefined
                ? { aiExposure: data.aiExposure }
                : {}),
            },
          });
          created++;
        }
      } else {
        // No domain → can't dedupe reliably; always create.
        await prisma.vendor.create({
          data: {
            name: data.name,
            category: data.category,
            ...(data.riskTier ? { riskTier: data.riskTier as any } : {}),
            ...(data.aiExposure !== undefined
              ? { aiExposure: data.aiExposure }
              : {}),
          },
        });
        created++;
      }
    } catch (e) {
      skipped++;
      errors.push({ row: rowNum, message: "Database error while saving row" });
    }
  }

  return NextResponse.json({ created, updated, skipped, errors });
}
