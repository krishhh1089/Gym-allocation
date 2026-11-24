import React from 'react';
import { Badge, Button } from '@/components/ui';
import { Building2, Users, Clock, Settings2 } from 'lucide-react';

export interface FacilityOccupancyData {
  id: string;
  name: string;
  location: string;
  totalCapacity: number;
  allocatedCount: number;
  activeCheckInsToday: number;
  totalSlots: number;
  operatingHours: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
}

export interface FacilityOccupancyBarProps {
  facility: FacilityOccupancyData;
  onManageSlots?: (facilityId: string) => void;
  className?: string;
}

export const FacilityOccupancyBar: React.FC<FacilityOccupancyBarProps> = ({
  facility,
  onManageSlots,
  className = '',
}) => {
  const percentage = Math.min(
    100,
    Math.round((facility.allocatedCount / facility.totalCapacity) * 100)
  );

  const getBarColor = () => {
    if (facility.status === 'MAINTENANCE') return 'var(--amber, #b57614)';
    if (percentage >= 95) return 'var(--oxblood, #9e2a2b)';
    if (percentage >= 80) return 'var(--amber, #b57614)';
    return 'var(--athletic-green, #2e4a3e)';
  };

  return (
    <div
      data-ui="facility-occupancy-bar"
      className={`p-5 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)] space-y-4 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)] shrink-0">
            <Building2 size={20} className="text-[var(--ink)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-black text-lg text-[var(--ink)]">
                {facility.name}
              </h3>
              <Badge
                status={facility.status === 'ACTIVE' ? 'ACTIVE' : 'LATE'}
                className="font-mono text-[10px]"
              >
                {facility.status}
              </Badge>
            </div>
            <p className="font-mono text-xs text-neutral-600 flex items-center gap-3 mt-0.5">
              <span>{facility.location}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {facility.operatingHours}
              </span>
            </p>
          </div>
        </div>

        {onManageSlots && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageSlots(facility.id)}
            className="font-mono text-xs gap-1.5"
          >
            <Settings2 size={13} /> Manage Slots
          </Button>
        )}
      </div>

      {/* Capacity & Occupancy Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
          <span className="flex items-center gap-1 text-[var(--ink)]">
            <Users size={13} /> Allocation Rate:
          </span>
          <span className="text-[var(--ink)]">
            {facility.allocatedCount} / {facility.totalCapacity} Athletes (
            <span style={{ color: getBarColor() }}>{percentage}%</span>)
          </span>
        </div>

        {/* Tactile Segmented Progress Bar */}
        <div className="h-5 bg-[var(--ledger-surface,#f4f2ee)] border-2 border-[var(--ink)] p-0.5 relative overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: getBarColor(),
            }}
          />
        </div>
      </div>

      {/* Bottom Metrics Pill Strip */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-neutral-300 text-center font-mono text-xs">
        <div className="p-2 bg-[var(--parchment,#fbfaf8)] border border-neutral-300">
          <span className="block text-[10px] uppercase text-neutral-500 font-bold">
            Configured Slots
          </span>
          <span className="font-bold text-[var(--ink)] text-sm">
            {facility.totalSlots} Daily Batches
          </span>
        </div>
        <div className="p-2 bg-[var(--parchment,#fbfaf8)] border border-neutral-300">
          <span className="block text-[10px] uppercase text-neutral-500 font-bold">
            Today's Check-ins
          </span>
          <span className="font-bold text-[var(--athletic-green)] text-sm">
            {facility.activeCheckInsToday} Admitted
          </span>
        </div>
        <div className="p-2 bg-[var(--parchment,#fbfaf8)] border border-neutral-300">
          <span className="block text-[10px] uppercase text-neutral-500 font-bold">
            Available Spots
          </span>
          <span className="font-bold text-neutral-700 text-sm">
            {facility.totalCapacity - facility.allocatedCount} Open
          </span>
        </div>
      </div>
    </div>
  );
};

