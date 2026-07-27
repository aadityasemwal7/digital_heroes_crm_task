import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/app/dashboard/DashboardClient';

export default async function DashboardPage() {
    // 1. Secure the route
    const session = await auth();
    if (!session) redirect('/login');

    const user = session.user as any;

    // 2. Fetch leads from Postgres
    // If Member, you could filter by `assignedToId: user.id`. For now, we fetch all to show RBAC in action.
    const leads = await prisma.lead.findMany({
        include: {
            assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch users so Admins can assign leads
    const teamMembers = await prisma.user.findMany({
        select: { id: true, name: true, role: true },
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center">
                <h1 className="font-bold text-xl">Digital Heroes CRM</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm bg-indigo-800 px-3 py-1 rounded-full border border-indigo-500">
                        {user.role} : {user.name}
                    </span>
                    <a href="/api/auth/signout" className="text-sm hover:underline text-indigo-200">
                        Sign Out
                    </a>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6 mt-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Lead Pipeline</h2>
                {/* We pass the data to a client component to handle interactive API calls */}
                <DashboardClient initialLeads={leads} teamMembers={teamMembers} currentUserRole={user.role} />
            </main>
        </div>
    );
}