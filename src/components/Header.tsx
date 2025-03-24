'use client';

import React from 'react';

type HeaderProps = {
  onSmokingButtonClick: () => void;
};

const Header: React.FC<HeaderProps> = ({ onSmokingButtonClick }) => {
  return (
    <header className="sticky top-0 z-10 bg-base-100 shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">わたべの禁煙アプリ</h1>
        
        {/* 喫煙ボタン - 常に表示 */}
        <button
          onClick={onSmokingButtonClick}
          className="btn btn-error btn-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="喫煙記録"
        >
          喫煙記録
        </button>
      </div>
    </header>
  );
};

export default Header;
