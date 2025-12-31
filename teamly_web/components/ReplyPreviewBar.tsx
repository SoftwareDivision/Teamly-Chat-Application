'use client';

interface ReplyPreviewBarProps {
  senderName: string;
  messageText: string;
  onCancel: () => void;
}

export default function ReplyPreviewBar({
  senderName,
  messageText,
  onCancel,
}: ReplyPreviewBarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      padding: '12px 20px',
      borderTop: '1px solid #E0E0E0',
    }}>
      <div style={{
        width: '4px',
        height: '40px',
        backgroundColor: '#E91E63',
        borderRadius: '2px',
        marginRight: '12px',
      }} />
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#E91E63',
          margin: '0 0 2px 0',
        }}>
          {senderName}
        </p>
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {messageText}
        </p>
      </div>
      <button
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          color: '#999',
          cursor: 'pointer',
          padding: '8px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
