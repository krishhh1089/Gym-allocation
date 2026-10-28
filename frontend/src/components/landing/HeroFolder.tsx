import React, { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Facility {
  id: string;
  name: string;
  tag: string;
  capacity: number;
  image: string;
  desc: string;
  highlights: string[];
}

const FACILITIES: Facility[] = [
  {
    id: 'raman',
    name: 'C. V. Raman Indoor Gym',
    tag: 'Free Weights & Strength',
    capacity: 60,
    image: '/assets/person-preparing-to-lift-a-barbell-at.jpg',
    desc: 'The primary high-performance barbell and resistance training facility at SRM University-AP. Features Olympic platforms, power cages, and competition grade plates.',
    highlights: ['6 Olympic Lifting Platforms', 'Full Dumbbell Rack up to 50kg', 'Dedicated Chalk Stations'],
  },
  {
    id: 'ganga',
    name: 'Ganga Fitness Hub',
    tag: 'Functional Training & Powerlifting',
    capacity: 45,
    image: '/assets/fit-young-man-doing-deadlift-exercise-in.jpg',
    desc: 'Designed for functional movement, powerlifting, and compound barbell conditioning. Spacious rubberized shock-absorbing flooring and safety spotter bars.',
    highlights: ['Competition Bench Presses', 'Heavy-Duty Squat Racks', 'Suspension & Kettlebell Zone'],
  },
  {
    id: 'krishna',
    name: 'Krishna Conditioning Center',
    tag: 'Athletics & Calisthenics',
    capacity: 50,
    image: '/assets/woman-doing-squat-workout-in-gym-with.jpg',
    desc: 'Cardiovascular endurance, HIIT training, and calisthenics rigs. Ideal for morning conditioning sessions and university sports team preparations.',
    highlights: ['Air Bikes & Concept2 Rowers', 'High Pull-up Rigs & Gymnastic Rings', 'Agility Sprint Track'],
  },
  {
    id: 'narmada',
    name: 'Narmada Strength Studio',
    tag: 'Guided Resistance & Mobility',
    capacity: 40,
    image: '/assets/young-attractive-man-athlete-doing-exercise-with.jpg',
    desc: 'Targeted selectorized resistance machines, cables, and guided mobility gear for beginners, injury rehab, and focused hypertrophy workouts.',
    highlights: ['Dual Cable Crossover Stations', 'Full Pin-Selected Machine Circuit', 'Dedicated Mobility Area'],
  },
];

export const HeroFolder: React.FC = () => {
  const [activeFacilityId, setActiveFacilityId] = useState('raman');
  const activeFacility = FACILITIES.find((f) => f.id === activeFacilityId) || FACILITIES[0];

  return (
    <div data-ui="hero-folder" style={{ width: '100%', marginBottom: '3.5rem' }}>
      {/* Physical Folder Tabs */}
      <div
        role="tablist"
        aria-label="Campus Gym Facilities"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.25rem',
          borderBottom: '2px solid var(--ink)',
          paddingLeft: '0.5rem',
          position: 'relative',
          zIndex: 2,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {FACILITIES.map((facility) => {
          const isActive = facility.id === activeFacilityId;

          return (
            <button
              key={facility.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFacilityId(facility.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--ink)' : 'var(--muted)',
                backgroundColor: isActive ? 'var(--surface)' : 'var(--surface-dark)',
                borderTop: '2px solid var(--ink)',
                borderLeft: '2px solid var(--ink)',
                borderRight: '2px solid var(--ink)',
                borderBottom: isActive ? '2px solid var(--surface)' : '2px solid var(--ink)',
                marginBottom: '-2px',
                borderRadius: '0px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color var(--t-hover) var(--ease-out)',
              }}
            >
              <span>{facility.name}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.1rem 0.35rem',
                  backgroundColor: isActive ? 'var(--accent)' : 'rgba(28,27,26,0.12)',
                  color: isActive ? '#fff' : 'var(--ink)',
                }}
              >
                {facility.capacity} Slots
              </span>
            </button>
          );
        })}
      </div>

      {/* Coupled Folder Sheet */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderLeft: '2px solid var(--ink)',
          borderRight: '2px solid var(--ink)',
          borderBottom: '2px solid var(--ink)',
          boxShadow: 'var(--shadow-offset)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {/* Facility Photo Frame */}
          <div
            style={{
              position: 'relative',
              border: '2px solid var(--ink)',
              boxShadow: '4px 4px 0px var(--ink)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg)',
            }}
          >
            <img
              src={activeFacility.image}
              alt={activeFacility.name}
              style={{
                width: '100%',
                height: '320px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                backgroundColor: 'rgba(28,27,26,0.85)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                border: '1px solid #fff',
              }}
            >
              SRM-AP ATHLETIC COMPLEX
            </div>
          </div>

          {/* Facility Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Badge status="ACTIVE" size="sm">
                {activeFacility.tag}
              </Badge>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                MAX CAPACITY: {activeFacility.capacity}
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.85rem',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0 0 0.75rem 0',
                lineHeight: 1.2,
              }}
            >
              {activeFacility.name}
            </h2>

            <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: '1.55', marginBottom: '1.25rem' }}>
              {activeFacility.desc}
            </p>

            {/* Highlights */}
            <div style={{ marginBottom: '1.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--faint)',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                Key Facility Equipment:
              </span>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--ink)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {activeFacility.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            {/* Action CTA */}
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <Link to="/student/slots" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
                  Browse {activeFacility.name} Batches
                </Button>
              </Link>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="md">
                  Student Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
