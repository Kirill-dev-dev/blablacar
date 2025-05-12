import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 border-t border-gray-200 mt-12 py-4 text-center text-xs text-gray-500">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="material-icons text-base">lock</span>
          Ваши платежные и личные данные надежно защищены.
        </div>
        <div>
          BlaBlaCar – крупнейший сервис поиска попутчиков. Мы объединяем людей, которым по пути. Отправиться в путь можно из пригорода или небольшого населенного пункта.<br />
          BlaBlaCar, 2024 ©
        </div>
      </div>
    </footer>
  );
} 