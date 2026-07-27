'use client';

import { useState } from 'react';
import LeadDetailsPanel from './LeadDetailsPanel';

type Lead = any; // In a production app, import the Prisma Lead type
type Member = { id: string; name: string; role: string };

export default function DashboardClient({
    initialLeads,
    teamMembers,
    currentUserRole,
}: {
    initialLeads: Lead[];
    teamMembers: Member[];
    currentUserRole: string;
}) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    const updateLead = async (leadId: string, payload: any) => {
        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(`Error: ${errorData.error}`);
                return;
            }

            const updatedLead = await res.json();
            setLeads((prev) =>
                prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
            );
        } catch (error) {
            alert('Failed to update lead');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                    <tr>
                        <th className="p-4 font-semibold tracking-wide">Prospect</th>
                        <th className="p-4 font-semibold tracking-wide">Contact</th>
                        <th className="p-4 font-semibold tracking-wide">Status</th>
                        <th className="p-4 font-semibold tracking-wide">Assigned To</th>
                        <th className="p-4 font-semibold tracking-wide text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                            <td className="p-4">
                                <div className="font-medium text-slate-900">{lead.name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{lead.company || 'No Company'}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-slate-700">{lead.email}</div>
                                {lead.phone && <div className="text-xs text-slate-500 mt-0.5">{lead.phone}</div>}
                            </td>
                            <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${lead.status === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                    ${lead.status === 'CONTACTED' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                    ${lead.status === 'QUALIFIED' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                    ${lead.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                    ${lead.status === 'LOST' ? 'bg-slate-100 text-slate-700 border-slate-300' : ''}
                                `}>
                                    {lead.status}
                                </span>
                            </td>
                            <td className="p-4">
                                {currentUserRole === 'ADMIN' ? (
                                    <select
                                        value={lead.assignedToId || ''}
                                        onChange={(e) => updateLead(lead.id, { assignedToId: e.target.value || null })}
                                        className="bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs w-full max-w-[150px] focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Unassigned</option>
                                        {teamMembers.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="text-slate-600 text-sm flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            {lead.assignedTo?.name ? lead.assignedTo.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        {lead.assignedTo?.name || 'Unassigned'}
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => setSelectedLeadId(lead.id)}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                    {leads.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-500">
                                <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <p className="text-lg font-medium text-slate-700">No leads found</p>
                                    <p className="text-sm mt-1">Go submit a test lead on the home page!</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <LeadDetailsPanel 
                leadId={selectedLeadId}
                isOpen={!!selectedLeadId}
                onClose={() => setSelectedLeadId(null)}
                currentUserRole={currentUserRole}
                teamMembers={teamMembers}
                onLeadUpdated={(updatedLead) => setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)))}
            />
        </div>
    );
}