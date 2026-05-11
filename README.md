# Student Attendance App

Bu proje:

- **React Bootstrap** ile tasarlanmış bir arayüz kullanır.
- **react-router-dom** ile sayfa yönlendirmesi yapar.
- Öğrenci listesini grid/table üstünde gösterir ve seçerek yoklama alır.
- Backend tarafında **PostgreSQL** kullanır.

## Klasör Yapısı

- `/frontend`: React uygulaması
- `/backend`: Express + PostgreSQL API

## Backend Çalıştırma

1. PostgreSQL üzerinde bir veritabanı oluşturun (ör. `student_db`).
2. `/backend/.env.example` dosyasını `/backend/.env` olarak kopyalayın ve bilgileri düzenleyin.
3. Komutları çalıştırın:

```bash
cd backend
npm install
npm start
```

API varsayılan olarak `http://localhost:3001` adresinde çalışır.

## Frontend Çalıştırma

1. `/frontend/.env.example` dosyasını `/frontend/.env` olarak kopyalayın.
2. Komutları çalıştırın:

```bash
cd frontend
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışır.
