import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface FolderTabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export const FolderTabs: React.FC<FolderTabsProps> = ({
  tabs,
  defaultTabId,
  activeTabId: controlledActiveTabId,
  onChange,
  className = '',
}) => {
  const [internalActiveTabId, setInternalActiveTabId] = useState<string>(
    defaultTabId || (tabs[0]?.id ?? '')
  );

  const activeId = controlledActiveTabId !== undefined ? controlledActiveTabId : internalActiveTabId;

  const handleSelectTab = (tabId: string) => {
    if (controlledActiveTabId === undefined) {
      setInternalActiveTabId(tabId);
    }
    onChange?.(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        handleSelectTab(nextTab.id);
        const nextButton = document.getElementById(`tab-btn-${nextTab.id}`);
        nextButton?.focus();
      }
    }
  };

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

  return (
    <div
      data-ui="folder-tabs"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
      className={className}
    >
      {/* Physical Folder Tab Bar */}
      <div
        role="tablist"
        aria-label="Folder Navigation"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.25rem',
          borderBottom: '2px solid var(--ink)',
          paddingLeft: '0.5rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeId;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
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
                transition: 'background-color var(--t-hover) var(--ease-out)',
                outline: 'none',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-tint)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-dark)';
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '3px solid var(--accent)';
                e.currentTarget.style.outlineOffset = '-2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {tab.icon && (
                <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    backgroundColor: isActive ? 'var(--accent)' : 'rgba(28, 27, 26, 0.15)',
                    color: isActive ? 'var(--accent-ink)' : 'var(--ink)',
                    lineHeight: 1,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel (Seamless Sheet) */}
      {activeTab && (
        <div
          id={`tab-panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-btn-${activeTab.id}`}
          tabIndex={0}
          style={{
            backgroundColor: 'var(--surface)',
            borderLeft: '2px solid var(--ink)',
            borderRight: '2px solid var(--ink)',
            borderBottom: '2px solid var(--ink)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-offset)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
};

FolderTabs.displayName = 'FolderTabs';
