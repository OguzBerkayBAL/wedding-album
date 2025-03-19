import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, backTo = '/' }) => {
  return (
    <header className="relative flex justify-center items-center py-4 px-3 bg-white shadow-sm">
      {showBackButton && (
        <Link
          to={backTo}
          className="absolute left-4 text-gray-600 text-sm flex items-center hover:text-gray-800 transition-colors"
        >
          <span className="mr-1">←</span> Geri
        </Link>
      )}
      <h1 className="m-0 text-xl md:text-2xl text-gray-800 font-medium text-center">{title}</h1>
    </header>
  );
};

export default Header; 