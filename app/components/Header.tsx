import React from 'react';

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto flex items-center h-20 px-4">
        <span className="text-3xl font-extrabold text-[#00aaff] mr-3 select-none">BlaBlaCar</span>
        <nav className="ml-6 flex gap-8 text-lg font-medium">
          <span className="border-b-2 border-[#0083a5] pb-1 text-[#0083a5]">Бронирование</span>
          <span className="text-gray-400">Оплата</span>
        </nav>
      </div>
    </header>
  );
} 