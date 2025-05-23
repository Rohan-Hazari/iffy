import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { parseMetadata } from "@/services/metadata";
import { authenticateRequest } from "@/app/api/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ recordId: string }> }) {
  const [isValid, clerkOrganizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { recordId: id } = await params;

  const record = await db.query.records.findFirst({
    where: and(
      eq(schema.records.clerkOrganizationId, clerkOrganizationId),
      eq(schema.records.id, id),
      isNull(schema.records.deletedAt),
    ),
    columns: {
      id: true,
      clientId: true,
      clientUrl: true,
      name: true,
      entity: true,
      protected: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      moderationStatus: true,
      moderationStatusCreatedAt: true,
      moderationPending: true,
      moderationPendingCreatedAt: true,
      userRecordId: true,
    },
  });

  if (!record) {
    return NextResponse.json({ error: { message: "Record not found" } }, { status: 404 });
  }

  const { userRecordId, metadata, ...rest } = record;
  return NextResponse.json({
    data: {
      ...rest,
      user: userRecordId,
      metadata: metadata ? parseMetadata(metadata) : undefined,
    },
  });
}
