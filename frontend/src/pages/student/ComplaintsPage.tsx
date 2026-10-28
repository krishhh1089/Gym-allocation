import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ComplaintModal, NewTicketPayload } from '@/components/complaints/ComplaintModal';
import { TicketThread, Ticket } from '@/components/complaints/TicketThread';
import { Button, Badge } from '@/components/ui';
import {
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 't_01',
    ticket_ref: '#TKT-2026-0891',
    category: 'Incorrect Absence Marked',
    subject: 'Scanner did not record attendance on Oct 22 at 06:05 AM',
    status: 'IN_PROGRESS',
    created_at: '2026-10-23',
    messages: [
      {
        id: 'm_01',
        sender_name: 'Aarav Raj',
        sender_role: 'STUDENT',
        timestamp: '2026-10-23 09:15 AM',
        text: 'Hello, I attended the 06:00 AM session at C. V. Raman Gym on Oct 22. The desk scanner flashed yellow and the screen seemed frozen. The trainer allowed me in, but my portal is showing an unexcused absence.',
      },
      {
        id: 'm_02',
        sender_name: 'Coach Rajesh Kumar',
        sender_role: 'STAFF',
        timestamp: '2026-10-23 11:40 AM',
        text: 'Hi Aarav, we are checking the manual desk turnstile backup log for Oct 22. Coach Murugan was on duty and will confirm your entry.',
      },
      {
        id: 'm_03',
        sender_name: 'Sports Admin Desk',
        sender_role: 'ADMIN',
        timestamp: '2026-10-23 02:10 PM',
        text: 'Your check-in was verified against the CCTV turnstile footage. An attendance audit correction will be applied shortly to remove the absence penalty.',
      },
    ],
  },
  {
    id: 't_02',
    ticket_ref: '#TKT-2026-0744',
    category: 'Equipment Maintenance',
    subject: 'Platform 3 barbell collar clamp loose in C. V. Raman',
    status: 'RESOLVED',
    created_at: '2026-10-18',
    messages: [
      {
        id: 'm_04',
        sender_name: 'Aarav Raj',
        sender_role: 'STUDENT',
        timestamp: '2026-10-18 07:10 AM',
        text: 'The safety spring collars on Olympic platform 3 are slipping under load. Please tighten or replace for athlete safety.',
      },
      {
        id: 'm_05',
        sender_name: 'Facilities Maintenance',
        sender_role: 'STAFF',
        timestamp: '2026-10-18 10:30 AM',
        text: 'Replacement Lock-Jaw Olympic collars have been installed on Platform 3 and 4. Thank you for notifying us.',
      },
    ],
  },
];

export const ComplaintsPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || 'Turnstile / Scanner Failure';
  const initialDate = searchParams.get('date');

  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(INITIAL_TICKETS[0].id);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleCreateTicket = (payload: NewTicketPayload) => {
    const newTicket: Ticket = {
      id: `t_${Date.now()}`,
      ticket_ref: `#TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      category: payload.category,
      subject: payload.subject,
      status: 'OPEN',
      created_at: new Date().toISOString().split('T')[0],
      messages: [
        {
          id: `m_${Date.now()}`,
          sender_name: 'Aarav Raj',
          sender_role: 'STUDENT',
          timestamp: 'Just now',
          text: payload.description,
        },
      ],
    };

    setTickets([newTicket, ...tickets]);
    setSelectedTicketId(newTicket.id);
    setNotification(`Support Ticket ${newTicket.ticket_ref} submitted successfully!`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSendMessage = (ticketId: string, text: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          messages: [
            ...t.messages,
            {
              id: `m_${Date.now()}`,
              sender_name: 'Aarav Raj',
              sender_role: 'STUDENT',
              timestamp: 'Just now',
              text,
            },
          ],
        };
      })
    );
  };

  return (
    <div
      data-ui="complaints-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        padding: '2rem 1.5rem 3.5rem 1.5rem',
      }}
    >
      <div className="wrap" style={{ maxWidth: '1050px' }}>
        {/* Navigation Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            paddingBottom: '0.85rem',
            borderBottom: '2px solid var(--ink)',
          }}
        >
          <Link
            to="/student/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--ink)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<PlusCircle size={15} />}
          >
            New Support Ticket
          </Button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
            }}
          >
            STUDENT COMPLIANCE & GRIEVANCES
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--step-head, 2.2rem)',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0.25rem 0 0.5rem 0',
              lineHeight: 1.15,
            }}
          >
            Student Support & Grievance Desk
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--muted)', maxWidth: '720px' }}>
            Report turnstile scanner errors, dispute incorrect absences, or request facility maintenance.
            All tickets are monitored by the Department of Physical Education.
          </p>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            style={{
              backgroundColor: 'var(--status-present-bg)',
              border: '2px solid var(--status-present)',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--status-present)',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{notification}</span>
          </div>
        )}

        {/* Dual Layout: Tickets List (Left) + Conversation Thread (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            alignItems: 'start',
          }}
        >
          {/* Tickets List Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                YOUR ACTIVE TICKETS ({tickets.length})
              </span>
            </div>

            {tickets.map((t) => {
              const isSelected = t.id === selectedTicketId;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{
                    backgroundColor: isSelected ? 'var(--surface-tint)' : 'var(--surface)',
                    border: isSelected ? '2.5px solid var(--accent)' : '2px solid var(--ink)',
                    boxShadow: isSelected ? 'var(--shadow-lift)' : 'var(--shadow-offset)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'transform var(--t-hover)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--muted)' }}>
                      {t.ticket_ref}
                    </span>
                    <Badge
                      status={
                        t.status === 'RESOLVED'
                          ? 'PRESENT'
                          : t.status === 'IN_PROGRESS'
                          ? 'WAITLISTED'
                          : 'PENDING'
                      }
                      size="sm"
                    >
                      {t.status}
                    </Badge>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', margin: '0 0 0.4rem 0', color: 'var(--ink)' }}>
                    {t.subject}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    <span>{t.category}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MessageSquare size={13} /> {t.messages.length} messages
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Conversation Thread Column */}
          <div>
            {selectedTicket ? (
              <TicketThread ticket={selectedTicket} onSendMessage={handleSendMessage} />
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '2px solid var(--ink)',
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--muted)',
                }}
              >
                Select a ticket to view the conversation history.
              </div>
            )}
          </div>
        </div>

        {/* Submit Ticket Modal */}
        <ComplaintModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTicket}
          defaultCategory={initialCategory}
          defaultSubject={initialDate ? `Attendance Dispute for Session on ${initialDate}` : ''}
        />
      </div>
    </div>
  );
};

ComplaintsPage.displayName = 'ComplaintsPage';
