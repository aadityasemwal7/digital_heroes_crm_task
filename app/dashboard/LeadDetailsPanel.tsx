'use client';

import React, { useState, useEffect } from 'react';

type Note = {
    id: string;
    content: string;
    createdAt: string;
    user: { name: string; role?: string };
};

type Activity = {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user: { name: string } | null;
};

type Lead = any; // You can import the Prisma type

export default function LeadDetailsPanel({
    leadId,
    isOpen,
    onClose,
    currentUserRole,
    teamMembers,
    onLeadUpdated,
}: {
    leadId: string | null;
    isOpen: boolean;
    onClose: () => void;
    currentUserRole: string;
    teamMembers: any[];
    onLeadUpdated?: (lead: Lead) => void;
}) {
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Fetch details when opened
    useEffect(() => {
        if (isOpen && leadId) {
            fetchLeadDetails();
        } else {
            setLead(null);
        }
    }, [isOpen, leadId]);

    const fetchLeadDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leads/${leadId}`);
            if (res.ok) {
                const data = await res.json();
                setLead(data);
            }
        } catch (error) {
            console.error('Failed to fetch lead details', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (payload: any) => {
        if (!lead) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const updated = await res.json();
                setLead(updated); // Update with new activities
                onLeadUpdated?.(updated); // Propagate up to DashboardClient
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert('Failed to update lead');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lead || !noteContent.trim()) return;

        setSubmittingNote(true);
        try {
            const res = await fetch(`/api/leads/${lead.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: noteContent }),
            });
            
            if (res.ok) {
                const newNote = await res.json();
                setNoteContent('');
                // Instead of manually appending note and missing the activity log, just refetch to get both accurately
                fetchLeadDetails();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert('Failed to add note');
        } finally {
            setSubmittingNote(false);
        }
    };

    // Combine and sort notes and activities for timeline
    const timeline = lead ? [...(lead.notes || []), ...(lead.activities || [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Lead Details</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading || !lead ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            
                            {/* Profile Info */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-900">{lead.name}</h3>
                                <p className="text-sm text-slate-500 mb-4">{lead.company || 'No Company Provided'}</p>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-slate-600">
                                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 transition-colors">{lead.email}</a>
                                    </div>
                                    {lead.phone && (
                                        <div className="flex items-center text-slate-600">
                                            <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <a href={`tel:${lead.phone}`} className="hover:text-indigo-600 transition-colors">{lead.phone}</a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Management Controls */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status Pipeline</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED'].map(status => (
                                            <button 
                                                key={status}
                                                disabled={updating}
                                                onClick={() => handleUpdate({ status })}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                                    lead.status === status 
                                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                                    : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                                                } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {currentUserRole === 'ADMIN' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assign To</label>
                                        <select
                                            disabled={updating}
                                            value={lead.assignedToId || ''}
                                            onChange={(e) => handleUpdate({ assignedToId: e.target.value || null })}
                                            className="w-full bg-white border border-slate-300 text-sm text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                                        >
                                            <option value="">Unassigned</option>
                                            {teamMembers.map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-200" />

                            {/* Add Note */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add a Note</label>
                                <form onSubmit={handleAddNote} className="space-y-3">
                                    <textarea
                                        required
                                        value={noteContent}
                                        onChange={e => setNoteContent(e.target.value)}
                                        placeholder="Discussed pricing options..."
                                        className="w-full bg-white border border-slate-300 text-sm text-black rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={submittingNote || !noteContent.trim()}
                                        className="bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                    >
                                        {submittingNote ? 'Saving...' : 'Save Note'}
                                    </button>
                                </form>
                            </div>

                            {/* Timeline */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Activity & Notes</label>
                                <div className="space-y-4">
                                    {timeline.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic text-center py-4">No activity yet.</p>
                                    ) : (
                                        timeline.map((item: any) => (
                                            <div key={item.id} className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                        item.content ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                                                    }`}>
                                                        {item.content ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                        )}
                                                    </div>
                                                    <div className="w-px h-full bg-slate-200 mt-2"></div>
                                                </div>
                                                <div className="pb-4">
                                                    <div className="text-xs text-slate-500 mb-1">
                                                        <span className="font-semibold text-slate-700">{item.user?.name || 'System'}</span>
                                                        <span className="mx-1">•</span>
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </div>
                                                    {item.content ? (
                                                        <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-1 whitespace-pre-wrap">
                                                            {item.content}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-600 mt-1">
                                                            {item.details}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
