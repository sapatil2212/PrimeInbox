import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contacts = await db.crmContact.findMany({
      where: { companyId: session.companyId },
      include: {
        crmCompany: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error("GET /api/crm/contacts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      title,
      companyName,
      status = "PROSPECT",
      notes,
    } = body;

    if (!email || !firstName) {
      return NextResponse.json({ error: "Email and First Name are required fields" }, { status: 400 });
    }

    let crmCompanyId: string | undefined = undefined;

    // Handle company association
    if (companyName && companyName.trim() !== "") {
      const companyClean = companyName.trim();
      
      // Try to find existing CRM company in this tenant
      let crmCompany = await db.crmCompany.findFirst({
        where: {
          companyId: session.companyId,
          name: { equals: companyClean },
        },
      });

      // Create new one if it doesn't exist
      if (!crmCompany) {
        crmCompany = await db.crmCompany.create({
          data: {
            companyId: session.companyId,
            name: companyClean,
          },
        });
      }
      
      crmCompanyId = crmCompany.id;
    }

    // Try to link with an existing Lead in the system matching email in the same tenant
    const matchedLead = await db.lead.findFirst({
      where: {
        companyId: session.companyId,
        email: email.trim(),
      },
    });

    const contact = await db.crmContact.create({
      data: {
        companyId: session.companyId,
        crmCompanyId: crmCompanyId || null,
        leadId: matchedLead?.id || null,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        phone: phone ? phone.trim() : null,
        title: title ? title.trim() : null,
        status,
        notes: notes ? notes.trim() : null,
      },
      include: {
        crmCompany: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error("POST /api/crm/contacts error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    // Verify contact belongs to the company before deletion
    const existingContact = await db.crmContact.findFirst({
      where: {
        id,
        companyId: session.companyId,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found or access denied" }, { status: 404 });
    }

    await db.crmContact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "CRM contact deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/crm/contacts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
