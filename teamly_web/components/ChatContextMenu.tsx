'use client';

import { useEffect } from 'react';

interface ChatContextMenuProps {
  visible: boolean;
  chatName: string;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: () => void;
}

export default function ChatContextMenu({
  visible,
  chatName,
  position,
  onClose,
  onDelete,
}: ChatContextMenuProps) {
  useEffect(() => {
    if (visible) {
      const handleClick = () => onClose();
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
        minWidth: '200px',
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <p style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#333',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {chatName}
        </p>
      </div>

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#e74c3c',
          fontWeight: '500',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={{ marginRight: '10px', fontSize: '16px' }}>🗑️</span>
        Delete Chat
      </button>
    </div>
  );
}
