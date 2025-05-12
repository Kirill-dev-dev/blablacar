'use client';

import React, { useState } from 'react';
import styles from './BookingForm.module.css';

export default function BookingForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь будет логика перехода на страницу оплаты
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.bookingContainer}>
      <h1 className={styles.title}>Подтверждение поездки</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="firstName">Имя *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="Введите ваше имя"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="lastName">Фамилия *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="Введите вашу фамилию"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="middleName">Отчество</label>
          <input
            type="text"
            id="middleName"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className={styles.input}
            placeholder="Введите ваше отчество (необязательно)"
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Забронировать
        </button>
      </form>
    </div>
  );
} 