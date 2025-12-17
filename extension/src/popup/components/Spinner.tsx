import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

function Spinner({ size = 'medium', text }: SpinnerProps) {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px',
  };

  return (
    <div className={`spinner-container spinner-${size}`}>
      <div
        className="spinner"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: `2px solid var(--color-bg-tertiary)`,
          borderTopColor: 'var(--color-accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }}
      />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}

export default Spinner;
