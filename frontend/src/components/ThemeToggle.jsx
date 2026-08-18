import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{
        width: '46px',
        height: '24px',
        backgroundColor: '#4b5563',
        borderRadius: '12px',
        padding: '2px',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        backgroundColor: 'white',
        borderRadius: '50%',
        position: 'absolute',
        transition: 'left 0.2s ease',
        left: theme === 'light' ? '2px' : '24px',
        zIndex: 2
      }}></div>
      
      {/* Icon always sits opposite to the white circle */}
      {theme === 'light' ? (
        <Moon size={14} color="#d1d5db" style={{ position: 'absolute', right: '6px', zIndex: 1 }} />
      ) : (
        <Sun size={14} color="#fbbf24" style={{ position: 'absolute', left: '6px', zIndex: 1 }} />
      )}
    </div>
  );
};

export default ThemeToggle;
