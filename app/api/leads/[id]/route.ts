import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                assignedTo: { select: { id: true, name: true, email: true } },
                notes: {
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                activities: {
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json(lead);
    } catch (error) {
        console.error(`[GET /api/leads/[id]] Error:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const { id } = await params;

        const body = await request.json();
        const { status, assignedToId } = body;

        const existingLead = await prisma.lead.findUnique({ where: { id } });
        if (!existingLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        if (assignedToId !== undefined && assignedToId !== existingLead.assignedToId) {
            if (user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'Forbidden: Only ADMIN users can reassign leads.' },
                    { status: 403 }
                );
            }
        }

        const updateData: any = {};
        const activityDetails: string[] = [];

        if (status && status !== existingLead.status) {
            updateData.status = status;
            activityDetails.push(`Status changed from ${existingLead.status} to ${status}`);
        }

        if (assignedToId !== undefined && assignedToId !== existingLead.assignedToId) {
            updateData.assignedToId = assignedToId;
            activityDetails.push(
                assignedToId 
                ? `Lead reassigned to user ID: ${assignedToId}` 
                : `Lead unassigned`
            );
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(existingLead);
        }

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: {
                ...updateData,
                activities: {
                    create: activityDetails.map((detail) => ({
                        action: 'LEAD_UPDATED',
                        details: detail,
                        userId: user.id,
                    })),
                },
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
                activities: { orderBy: { createdAt: 'desc' } },
            },
        });

        return NextResponse.json(updatedLead);
    } catch (error) {
        console.error(`[PATCH /api/leads/[id]] Error:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
