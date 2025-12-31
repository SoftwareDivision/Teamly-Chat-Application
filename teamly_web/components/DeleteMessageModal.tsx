'use client';

import { IoClose, IoTrash } from 'react-icons/io5';

interface DeleteMessageModalProps {
  visible: boolean;
  messageCount: number;
  canDeleteForEveryone: boolean; // Only true if ALL selected messages are sent by current user
  onClose: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}

export default function DeleteMessageModal({
  visible,
  messageCount,
  canDeleteForEveryone,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}: DeleteMessageModalProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
          width: '320px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IoTrash size={20} color="#E91E63" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#212121' }}>
              Delete {messageCount > 1 ? `${messageCount} messages` : 'message'}?
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#757575',
            }}
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Delete for everyone - Only show if user can delete for everyone (sent messages only) */}
          {canDeleteForEveryone && (
            <button
              onClick={onDeleteForEveryone}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#FFEBEE',
                border: '1px solid #FFCDD2',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFCDD2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFEBEE';
              }}
            >
              <div style={{ fontWeight: '600', color: '#C62828', fontSize: '14px' }}>
                Delete for everyone
              </div>
              <div style={{ fontSize: '12px', color: '#757575', marginTop: '2px' }}>
                This message will be deleted for all participants
              </div>
            </button>
          )}

          {/* Delete for me */}
          <button
            onClick={onDeleteForMe}
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: '#F5F5F5',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EEEEEE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
            }}
          >
            <div style={{ fontWeight: '600', color: '#424242', fontSize: '14px' }}>
              Delete for me
            </div>
            <div style={{ fontSize: '12px', color: '#757575', marginTop: '2px' }}>
              This message will only be deleted from your device
            </div>
          </button>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '12px',
            backgroundColor: 'transparent',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#757575',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
