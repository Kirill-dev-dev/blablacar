'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuccessPage() {
  const router = useRouter();

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
        <p className="text-gray-600 text-center">
          Спасибо за использование нашего сервиса. Вы будете перенаправлены на главную страницу через 5 секунд.
        </p>
      </div>
    </main>
  );
} 