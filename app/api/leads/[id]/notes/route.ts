import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(
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
        const { content } = body;

        if (!content || typeof content !== 'string' || content.trim() === '') {
            return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
        }

        // Create the Note AND the ActivityLog in a single Transaction
        const [newNote] = await prisma.$transaction([
            prisma.note.create({
                data: {
                    content: content.trim(),
                    leadId: id,
                    userId: user.id,
                },
                include: { user: { select: { name: true, role: true } } },
            }),
            prisma.activityLog.create({
                data: {
                    action: 'NOTE_ADDED',
                    details: `Note added by ${user.name || 'a team member'}`,
                    leadId: id,
                    userId: user.id,
                },
            }),
        ]);

        return NextResponse.json(newNote, { status: 201 });
    } catch (error) {
        console.error(`[POST /api/leads/[id]/notes] Error:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}