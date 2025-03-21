import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = 'Düğün Albümü',
  showBackButton = false,
  backTo = '/'
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-primary to-pink-400 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button
                onClick={() => navigate(backTo)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Geri"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <Link to="/" className="flex items-center space-x-1">
              <span className="text-2xl">💍</span>
              <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="text-sm px-3 py-1.5 font-medium bg-white/10 rounded-md hover:bg-white/20 transition-colors"
            >
              Anasayfa
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 