import React, { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { User, ShieldCheck, Send, Clock } from 'lucide-react';

export interface TicketMessage {
  id: string;
  sender_name: string;
  sender_role: 'STUDENT' | 'STAFF' | 'ADMIN';
  timestamp: string;
  text: string;
}

export interface Ticket {
  id: string;
  ticket_ref: string;
  category: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  messages: TicketMessage[];
}

export interface TicketThreadProps {
  ticket: Ticket;
  onSendMessage?: (ticketId: string, text: string) => void;
  className?: string;
}

export const TicketThread: React.FC<TicketThreadProps> = ({
  ticket,
  onSendMessage,
  className = '',
}) => {
  const [replyText, setReplyText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendMessage?.(ticket.id, replyText);
    setReplyText('');
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'OPEN':
        return <Badge status="PENDING" size="sm">OPEN</Badge>;
      case 'IN_PROGRESS':
        return <Badge status="WAITLISTED" size="sm">IN PROGRESS</Badge>;
      case 'RESOLVED':
        return <Badge status="PRESENT" size="sm">RESOLVED</Badge>;
      case 'CLOSED':
        return <Badge status="NEUTRAL" size="sm">CLOSED</Badge>;
    }
  };

  return (
    <div
      data-ui="ticket-thread"
      style={{
        backgroundColor: 'var(--surface)',
        border: '2px solid var(--ink)',
        boxShadow: 'var(--shadow-offset)',
        display: 'flex',
        flexDirection: 'column',
      }}
      className={className}
    >
      {/* Ticket Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '2px solid var(--ink)',
          backgroundColor: 'var(--surface-dark)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>
              {ticket.ticket_ref}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--faint)' }}>· {ticket.category}</span>
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', margin: 0 }}>
            {ticket.subject}
          </h3>
        </div>

        <div>{getStatusBadge(ticket.status)}</div>
      </div>

      {/* Messages Thread */}
      <div
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxHeight: '480px',
          overflowY: 'auto',
          backgroundColor: 'var(--surface)',
        }}
      >
        {ticket.messages.map((msg) => {
          const isStaff = msg.sender_role === 'STAFF' || msg.sender_role === 'ADMIN';

          return (
            <div
              key={msg.id}
              style={{
                backgroundColor: isStaff ? 'var(--status-present-bg)' : 'var(--surface-tint)',
                border: isStaff ? '1.5px solid var(--accent)' : '1.5px solid var(--ink)',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {isStaff ? (
                    <ShieldCheck size={16} color="var(--accent)" />
                  ) : (
                    <User size={16} color="var(--ink)" />
                  )}
                  <strong>{msg.sender_name}</strong>
                  <Badge status={isStaff ? 'ACTIVE' : 'NEUTRAL'} size="sm" dot={false}>
                    {msg.sender_role}
                  </Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  <Clock size={12} />
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink)', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Reply Form */}
      {ticket.status !== 'CLOSED' && (
        <form
          onSubmit={handleSend}
          style={{
            padding: '1.25rem 1.5rem',
            borderTop: '2px solid var(--ink)',
            backgroundColor: 'var(--surface-tint)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
            Add Follow-Up Reply:
          </label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Type your response to the sports staff..."
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="primary" size="sm" rightIcon={<Send size={14} />}>
              Send Reply
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

TicketThread.displayName = 'TicketThread';
