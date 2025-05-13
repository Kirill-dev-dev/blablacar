'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Функция для генерации случайного номера билета
function generateTicketNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let ticketNumber = 'BL-';
  
  // Добавляем 2 случайные буквы
  for (let i = 0; i < 2; i++) {
    ticketNumber += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Добавляем 4 случайные цифры
  for (let i = 0; i < 4; i++) {
    ticketNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return ticketNumber;
}

export default function SuccessPage() {
  const router = useRouter();
  const [ticketNumber] = useState(generateTicketNumber());

  useEffect(() => {
    // Перенаправляем на главную страницу через 5 секунд
    const timeout = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main className="max-w-md mx-auto py-12 px-4">
      <div className="flex flex-col items-center gap-6 bg-white rounded-2xl shadow-lg p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-center">Оплата успешно завершена!</h1>
        <div className="text-center">
          <p className="text-gray-600 mb-2">Номер вашего билета:</p>
          <p className="text-xl font-bold text-[#00aaff]">{ticketNumber}</p>
        </div>
        <p className="text-gray-600 text-center">
          Спасибо за использование нашего сервиса. Вы будете перенаправлены на главную страницу через 5 секунд.
        </p>
      </div>
    </main>
  );
} 