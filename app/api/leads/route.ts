import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET: List leads with pagination and filters
export async function GET(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const assignedToId = searchParams.get('assignedToId');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    try {
        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignedTo: { select: { id: true, name: true } },
                },
            }),
            prisma.lead.count({ where }),
        ]);

        return NextResponse.json({
            data: leads,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Public lead creation
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, company } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required.' },
                { status: 400 }
            );
        }

        const lead = await prisma.lead.create({
            data: {
                name,
                email,
                phone: phone || null,
                company: company || null,
                status: 'NEW',
            },
        });

        // Optionally log activity
        await prisma.activityLog.create({
            data: {
                action: 'LEAD_CREATED',
                details: `New lead created via public form: ${name}`,
                leadId: lead.id,
            },
        });

        return NextResponse.json(lead, { status: 201 });
    } catch (error: any) {
        console.error('Error creating lead:', error);
        return NextResponse.json(
            { error: 'Failed to create lead.' },
            { status: 500 }
        );
    }
}