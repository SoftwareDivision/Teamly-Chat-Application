'use client';

// Reusable skeleton components for loading states

export function ChatListSkeleton() {
  return (
    <div style={{ padding: '8px' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            gap: '12px',
            marginBottom: '4px',
          }}
        >
          {/* Avatar skeleton */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#E0E0E0',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          
          {/* Content skeleton */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: '16px',
                width: '60%',
                backgroundColor: '#E0E0E0',
                borderRadius: '4px',
                marginBottom: '8px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '14px',
                width: '80%',
                backgroundColor: '#F0F0F0',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: '0.1s',
              }}
            />
          </div>

          {/* Time skeleton */}
          <div
            style={{
              height: '12px',
              width: '40px',
              backgroundColor: '#F0F0F0',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: '0.2s',
            }}
          />
        </div>
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div style={{ padding: '20px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              maxWidth: '60%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: i % 2 === 0 ? '#D9FDD3' : '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                height: '14px',
                width: `${Math.random() * 40 + 60}%`,
                backgroundColor: i % 2 === 0 ? '#C8F0C0' : '#E0E0E0',
                borderRadius: '4px',
                marginBottom: '8px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '14px',
                width: `${Math.random() * 30 + 50}%`,
                backgroundColor: i % 2 === 0 ? '#C8F0C0' : '#E0E0E0',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: '0.1s',
              }}
            />
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      {/* Avatar skeleton */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: '#E0E0E0',
          margin: '0 auto 20px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      
      {/* Name skeleton */}
      <div
        style={{
          height: '24px',
          width: '200px',
          backgroundColor: '#E0E0E0',
          borderRadius: '4px',
          margin: '0 auto 12px',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: '0.1s',
        }}
      />
      
      {/* Email skeleton */}
      <div
        style={{
          height: '16px',
          width: '250px',
          backgroundColor: '#F0F0F0',
          borderRadius: '4px',
          margin: '0 auto 8px',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: '0.2s',
        }}
      />
      
      {/* Phone skeleton */}
      <div
        style={{
          height: '16px',
          width: '180px',
          backgroundColor: '#F0F0F0',
          borderRadius: '4px',
          margin: '0 auto 40px',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: '0.3s',
        }}
      />

      {/* Options skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            gap: '16px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: '#E0E0E0',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
          <div
            style={{
              height: '16px',
              width: '120px',
              backgroundColor: '#E0E0E0',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        </div>
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export function GenericSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ padding: '20px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '16px',
            width: `${Math.random() * 30 + 60}%`,
            backgroundColor: '#E0E0E0',
            borderRadius: '4px',
            marginBottom: '12px',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
