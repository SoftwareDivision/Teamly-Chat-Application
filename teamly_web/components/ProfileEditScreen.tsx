'use client';

import { useState, useRef } from 'react';
import { ApiService, AuthService } from 'teamly_shared';
import { IoCamera, IoPencil, IoCheckmark } from 'react-icons/io5';

interface ProfileEditScreenProps {
  userProfile: {
    name: string;
    email: string;
    phone: string;
    photo?: string;
  };
  onProfileUpdate: (updatedProfile: any) => void;
  onLogout: () => void;
}

export default function ProfileEditScreen({ userProfile, onProfileUpdate, onLogout }: ProfileEditScreenProps) {
  const [editingField, setEditingField] = useState<'name' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditStart = (field: 'name' | 'phone') => {
    setEditingField(field);
    setEditValue(field === 'name' ? userProfile.name : userProfile.phone);
  };

  const handleEditSave = async () => {
    if (!editValue.trim() || !editingField) return;
    
    try {
      const token = await AuthService.getToken();
      if (!token) return;

      const newName = editingField === 'name' ? editValue.trim() : userProfile.name;
      const newPhone = editingField === 'phone' ? editValue.trim() : userProfile.phone;

      const response = await ApiService.updateProfile(token, newName, newPhone, userProfile.photo);
      
      if (response.success) {
        onProfileUpdate({ ...userProfile, name: newName, phone: newPhone });
        await AuthService.saveUserData({ ...userProfile, name: newName, phone: newPhone });
        setEditingField(null);
      }
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const token = await AuthService.getToken();
        if (!token) return;
        const response = await ApiService.updateProfile(token, userProfile.name, userProfile.phone, base64);
        if (response.success) {
          onProfileUpdate({ ...userProfile, photo: base64 });
          await AuthService.saveUserData({ ...userProfile, profilePhoto: base64 });
        }
      } catch (error) {
        console.error('Failed to upload:', error);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ backgroundColor: '#F0F2F5', height: '100%', overflowY: 'auto' }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
      
      {/* Profile Photo */}
      <div style={{ backgroundColor: '#fff', padding: '30px 20px', textAlign: 'center' }}>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto', cursor: 'pointer' }}
        >
          {userProfile.photo ? (
            <img src={userProfile.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E0E0E0' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#666' }}>
              {userProfile.name[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E91E63', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <IoCamera size={18} color="#fff" />
          </div>
        </div>
        {isUploading && <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>Uploading...</p>}
      </div>


      {/* Name */}
      <div style={{ backgroundColor: '#fff', marginTop: '12px', padding: '12px 16px' }}>
        <p style={{ fontSize: '13px', color: '#E91E63', margin: '0 0 4px 0' }}>Your name</p>
        {editingField === 'name' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              style={{ flex: 1, border: 'none', borderBottom: '2px solid #E91E63', padding: '8px 0', fontSize: '16px', outline: 'none' }}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
            />
            <button onClick={handleEditSave} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <IoCheckmark size={24} color="#E91E63" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '16px', color: '#111', margin: 0 }}>{userProfile.name || 'Not set'}</p>
            <button onClick={() => handleEditStart('name')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <IoPencil size={20} color="#8696A0" />
            </button>
          </div>
        )}
      </div>

      {/* Phone */}
      <div style={{ backgroundColor: '#fff', marginTop: '1px', padding: '12px 16px' }}>
        <p style={{ fontSize: '13px', color: '#E91E63', margin: '0 0 4px 0' }}>Phone</p>
        {editingField === 'phone' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="tel"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              style={{ flex: 1, border: 'none', borderBottom: '2px solid #E91E63', padding: '8px 0', fontSize: '16px', outline: 'none' }}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
            />
            <button onClick={handleEditSave} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <IoCheckmark size={24} color="#E91E63" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '16px', color: '#111', margin: 0 }}>{userProfile.phone || 'Not set'}</p>
            <button onClick={() => handleEditStart('phone')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <IoPencil size={20} color="#8696A0" />
            </button>
          </div>
        )}
      </div>

      {/* Email (read-only) */}
      <div style={{ backgroundColor: '#fff', marginTop: '1px', padding: '12px 16px' }}>
        <p style={{ fontSize: '13px', color: '#8696A0', margin: '0 0 4px 0' }}>Email</p>
        <p style={{ fontSize: '16px', color: '#111', margin: 0 }}>{userProfile.email}</p>
      </div>

      {/* Logout */}
      <div style={{ padding: '20px 16px' }}>
        <button
          onClick={onLogout}
          style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#E91E63', border: '1px solid #E91E63', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
