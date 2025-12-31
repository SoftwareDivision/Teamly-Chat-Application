'use client';

export default function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      padding: '8px 12px',
    }}>
      <div className="typing-dot" style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#90949C',
        animation: 'typingAnimation 1.4s infinite',
        animationDelay: '0s',
      }} />
      <div className="typing-dot" style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#90949C',
        animation: 'typingAnimation 1.4s infinite',
        animationDelay: '0.2s',
      }} />
      <div className="typing-dot" style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#90949C',
        animation: 'typingAnimation 1.4s infinite',
        animationDelay: '0.4s',
      }} />
      
      <style jsx>{`
        @keyframes typingAnimation {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
