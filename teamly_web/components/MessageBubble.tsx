'use client';

import { MessageModel } from 'teamly_shared';
import { useState } from 'react';
import { IoCheckmark, IoCheckmarkDone, IoTime, IoArrowUndo } from 'react-icons/io5';

interface MessageBubbleProps {
  message: MessageModel;
  formatTimestamp: (date: Date) => string;
  isSelected?: boolean;
  selectionMode?: boolean;
  onLongPress?: () => void;
  onClick?: () => void;
  onReply?: () => void;
  onReplyPress?: () => void;
  isHighlighted?: boolean;
}

export default function MessageBubble({
  message,
  formatTimestamp,
  isSelected = false,
  selectionMode = false,
  onLongPress,
  onClick,
  onReply,
  onReplyPress,
  isHighlighted = false,
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Helper function to render text with clickable links
  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: '#0066CC',
              textDecoration: 'underline',
              wordBreak: 'break-all',
            }}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderStatusIcon = () => {
    switch (message.status) {
      case 'pending':
        return <IoTime size={14} style={{ opacity: 0.7, color: '#8696A0' }} />;
      case 'sent':
        return <IoCheckmark size={16} style={{ color: '#8696A0' }} />;
      case 'delivered':
        return <IoCheckmarkDone size={16} style={{ color: '#8696A0' }} />;
      case 'read':
        return <IoCheckmarkDone size={16} style={{ color: '#53BDEB' }} />;
      default:
        return null;
    }
  };

  // WhatsApp-style checkbox
  const renderCheckbox = () => {
    const showCheckbox = isHovered || selectionMode;
    
    return (
      <div 
        style={{
          width: '24px',
          height: '24px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: showCheckbox ? 1 : 0,
          transition: 'opacity 0.2s ease',
          marginRight: '8px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (selectionMode) {
            onClick && onClick();
          } else {
            onLongPress && onLongPress(); // Enter selection mode
          }
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: isSelected ? 'none' : '2px solid #8696A0',
          backgroundColor: isSelected ? '#00A884' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          {isSelected && (
            <IoCheckmark size={16} style={{ color: '#FFFFFF' }} />
          )}
        </div>
      </div>
    );
  };

  if (message.isSent) {
    return (
      <div
        data-message-id={message.id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '2px 20px',
          marginBottom: '2px',
          backgroundColor: isHighlighted ? 'rgba(255, 235, 59, 0.3)' : isSelected ? 'rgba(233, 30, 99, 0.05)' : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        {renderCheckbox()}
        <div
          onClick={() => selectionMode && onClick && onClick()}
          style={{
            maxWidth: '60%',
            backgroundColor: '#D9FDD3',
            padding: '6px 7px 8px 9px',
            borderRadius: '8px',
            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
            cursor: selectionMode ? 'pointer' : 'default',
          }}
        >
          {message.replyTo && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onReplyPress && onReplyPress();
              }}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                borderRadius: '4px',
                padding: '6px 8px',
                marginBottom: '6px',
                borderLeft: '4px solid #00A884',
                cursor: 'pointer',
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#00A884', margin: '0 0 2px 0' }}>
                {message.replyTo.senderName || 'User'}
              </p>
              <p style={{ fontSize: '12px', color: '#667781', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                {message.replyTo.text}
              </p>
            </div>
          )}
          
          {/* Show text (which includes Drive link if present) */}
          {message.text && (
            <p style={{ 
              color: '#111B21', 
              fontSize: '14.2px', 
              margin: '0 0 4px 0',
              lineHeight: '19px',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}>
              {renderTextWithLinks(message.text)}
            </p>
          )}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            gap: '4px',
            marginTop: '2px',
          }}>
            <span style={{ 
              color: '#667781', 
              fontSize: '11px',
            }}>
              {formatTimestamp(message.timestamp)}
            </span>
            {renderStatusIcon()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-message-id={message.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '2px 20px',
        marginBottom: '2px',
        backgroundColor: isHighlighted ? 'rgba(255, 235, 59, 0.3)' : isSelected ? 'rgba(233, 30, 99, 0.05)' : 'transparent',
        transition: 'background-color 0.2s ease',
      }}
    >
      {renderCheckbox()}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', maxWidth: '60%' }}>
        <div
          onClick={() => selectionMode && onClick && onClick()}
          style={{
            backgroundColor: '#FFFFFF',
            padding: '6px 7px 8px 9px',
            borderRadius: '8px',
            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
            position: 'relative',
            cursor: selectionMode ? 'pointer' : 'default',
          }}
        >
          {message.replyTo && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onReplyPress && onReplyPress();
              }}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
                padding: '6px 8px',
                marginBottom: '6px',
                borderLeft: '4px solid #E91E63',
                cursor: 'pointer',
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#E91E63', margin: '0 0 2px 0' }}>
                {message.replyTo.senderName || 'User'}
              </p>
              <p style={{ fontSize: '12px', color: '#667781', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                {message.replyTo.text}
              </p>
            </div>
          )}
          
          {/* Show text (which includes Drive link if present) */}
          {message.text && (
            <p style={{ 
              color: '#111B21', 
              fontSize: '14.2px', 
              margin: '0 0 4px 0',
              lineHeight: '19px',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}>
              {renderTextWithLinks(message.text)}
            </p>
          )}
          <p style={{ 
            color: '#667781', 
            fontSize: '11px', 
            margin: 0, 
            textAlign: 'right',
          }}>
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
        {!selectionMode && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply && onReply();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#8696A0',
              marginBottom: '4px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00A884'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#8696A0'}
            title="Reply"
          >
            <IoArrowUndo size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
