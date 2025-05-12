import './globals.css';
import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import NotifyOnVisit from './components/NotifyOnVisit';

export const metadata = {
  title: 'Бронирование BlaBlaCar',
  description: 'Страница бронирования поездки BlaBlaCar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="bg-[#f5f5f5] min-h-screen flex flex-col">
        <NotifyOnVisit />
        <Header />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
