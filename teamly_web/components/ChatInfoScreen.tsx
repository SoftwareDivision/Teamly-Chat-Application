'use client';

import { useState, useEffect } from 'react';
import { ApiService, AuthService } from 'teamly_shared';

interface Member {
  user_id: number;
  username: string;
  email: string;
  profile_photo?: string;
  role: string;
}

interface ChatInfoScreenProps {
  chatName: string;
  chatType: 'self' | 'private' | 'group';
  chatId: string;
  onBack: () => void;
}

export default function ChatInfoScreen({
  chatName,
  chatType,
  chatId,
  onBack,
}: ChatInfoScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(chatName);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chatType === 'group') {
      loadMembers();
    }
  }, [chatType, chatId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      if (!token) return;

      const response = await ApiService.getChatMembers(token, chatId);
      if (response.success && response.members) {
        setMembers(response.members);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (editedName.trim() === '') {
      alert('Chat name cannot be empty');
      return;
    }
    // TODO: Implement rename API call
    setIsEditing(false);
    alert('Group name updated');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#E91E63',
        color: '#fff',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          ←
        </button>
        <h2 style={{ flex: 1, fontSize: '18px', fontWeight: '600', margin: '0 0 0 8px' }}>
          Chat Info
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Profile Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px',
          backgroundColor: '#f9f9f9',
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '60px',
            backgroundColor: '#E91E63',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '48px', color: '#fff', fontWeight: 'bold' }}>
              {chatName[0]?.toUpperCase()}
            </span>
          </div>

          {/* Chat Name */}
          {isEditing ? (
            <div style={{ width: '80%' }}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                autoFocus
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#333',
                  padding: '8px',
                  textAlign: 'center',
                  width: '100%',
                  border: 'none',
                  borderBottom: '2px solid #E91E63',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '8px 24px',
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    color: '#999',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '8px 24px',
                    backgroundColor: '#E91E63',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '16px',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                {chatName}
              </h3>
              {chatType === 'group' && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                  }}
                >
                  ✏️
                </button>
              )}
            </div>
          )}
          {chatType === 'group' && !isEditing && (
            <p style={{ fontSize: '13px', color: '#999', marginTop: '6px' }}>
              Tap pencil to edit name
            </p>
          )}
        </div>

        {/* Members Section */}
        {chatType === 'group' && (
          <div style={{
            marginTop: '16px',
            backgroundColor: '#fff',
            borderTop: '1px solid #f0f0f0',
            borderBottom: '1px solid #f0f0f0',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>
                Members ({members.length})
              </h4>
              {loading && <span style={{ fontSize: '12px', color: '#999' }}>Loading...</span>}
            </div>
            {members.length > 0 ? (
              members.map((member) => (
                <div
                  key={member.user_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div style={{ marginRight: '12px' }}>
                    {member.profile_photo ? (
                      <img
                        src={member.profile_photo}
                        alt={member.username}
                        style={{ width: '40px', height: '40px', borderRadius: '20px' }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '20px',
                        backgroundColor: '#E91E63',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>
                          {member.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 2px 0' }}>
                      {member.username}
                    </p>
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                      {member.email}
                    </p>
                  </div>
                  {member.role === 'admin' && (
                    <div style={{
                      backgroundColor: '#FFE0E6',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#E91E63' }}>
                        Admin
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: '#999', textAlign: 'center', padding: '16px' }}>
                No members found
              </p>
            )}
          </div>
        )}

        {/* Info Section */}
        <div style={{ padding: '16px', marginTop: '16px' }}>
          <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', lineHeight: '20px' }}>
            {chatType === 'self'
              ? 'This is your personal space for notes and reminders.'
              : chatType === 'group'
              ? `Group chat with ${members.length} member${members.length !== 1 ? 's' : ''}`
              : 'Private chat'}
          </p>
        </div>
      </div>
    </div>
  );
}
