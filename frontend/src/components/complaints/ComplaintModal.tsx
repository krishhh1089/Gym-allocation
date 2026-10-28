import React, { useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { Send, AlertCircle } from 'lucide-react';

export interface NewTicketPayload {
  category: string;
  subject: string;
  description: string;
}

export interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewTicketPayload) => void;
  defaultCategory?: string;
  defaultSubject?: string;
}

const CATEGORIES = [
  'Turnstile / Scanner Failure',
  'Incorrect Absence Marked',
  'Slot Allocation Inquiry',
  'Equipment Maintenance',
  'General Grievance',
];

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultCategory = 'Incorrect Absence Marked',
  defaultSubject = '',
}) => {
  const [category, setCategory] = useState(defaultCategory);
  const [subject, setSubject] = useState(defaultSubject);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a subject summary.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description of the grievance.');
      return;
    }

    onSubmit({ category, subject, description });
    setSubject('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Support & Grievance Ticket"
      description="Direct communication desk with the Department of Physical Education"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} rightIcon={<Send size={15} />}>
            Submit Ticket
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--status-absent-bg)',
              border: '1.5px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '0.925rem',
              display: 'block',
              marginBottom: '0.35rem',
            }}
          >
            Grievance Category: <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--surface-tint)',
              border: '2px solid var(--ink)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Subject Line"
          placeholder="e.g. Scanned turnstile on Oct 26 at 06:05 AM but recorded as Absent"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <div>
          <label
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '0.925rem',
              display: 'block',
              marginBottom: '0.35rem',
            }}
          >
            Detailed Description: <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Provide context such as the facility name, batch time, turnstile camera used, or relevant circumstances..."
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--surface-tint)',
              border: '2px solid var(--ink)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.9rem',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
            required
          />
        </div>
      </form>
    </Modal>
  );
};

ComplaintModal.displayName = 'ComplaintModal';
