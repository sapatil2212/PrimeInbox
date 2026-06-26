import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await db.smtpGroup.findMany({
      where: { companyId: session.companyId },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error("GET /api/smtp/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, smtpAccountIds } = body; // Array of SMTP Account IDs to map

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "SMTP group name is required" }, { status: 400 });
    }

    const group = await db.$transaction(async (tx) => {
      const g = await tx.smtpGroup.create({
        data: {
          companyId: session.companyId!,
          name: name.trim(),
          description: description?.trim() || null,
        },
      });

      if (smtpAccountIds && Array.isArray(smtpAccountIds) && smtpAccountIds.length > 0) {
        await Promise.all(
          smtpAccountIds.map((accId: string) =>
            tx.smtpGroupAccount.create({
              data: {
                smtpGroupId: g.id,
                smtpAccountId: accId,
              },
            })
          )
        );
      }

      return g;
    });

    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (error) {
    console.error("POST /api/smtp/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
