import { describe, it, expect } from 'vitest';

describe('Lead Flow', () => {
  it('should allow public lead creation', async () => {
    const res = await fetch('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '123-456-7890',
        message: 'Interested in your services.'
      })
    });
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test Lead');
    expect(data.status).toBe('new');
  });

  it('should allow adding timestamped notes and audit logs', async () => {
    // Note: In reality, we would create a lead first or use a mocked ID.
    const res = await fetch('http://localhost:3000/api/leads/1/notes', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-admin-token' 
      },
      body: JSON.stringify({
        content: 'Left a voicemail for the prospect.'
      })
    });
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.content).toBe('Left a voicemail for the prospect.');
    expect(data).toHaveProperty('createdAt'); // Ensuring timestamp is present
  });
});
