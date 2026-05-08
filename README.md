# Student Takip Uygulaması (PHP + MySQL + React)

Bu proje, öğrenci takip ihtiyaçları için hazırlanmış bir MVP uygulamadır.

## Özellikler

- Login sistemi (admin + öğretmen)
- Öğrenci ekleme
  - Ders saati
  - Ders (risale, vecize, kuran)
  - Alt ders seçimi/ekleme
  - İsim soyisim, okul, sınıf, telefon
  - Veli adı, veli telefonu
- Öğretmen ekleme
- Öğretmene öğrenci atama
- Yoklama alma
- Öğrenciye özel ödev verme
- Öğrenci hakkında öğretmen yorumu yazma

## Klasör Yapısı

- `/home/runner/work/student/student/backend` → PHP API + MySQL şema
- `/home/runner/work/student/student/frontend` → React (Vite) arayüz

## Gereksinimler

- PHP 8+
- MySQL 8+
- Node.js 20+

## Backend Kurulumu

1. MySQL’de veritabanı oluşturun:

```sql
CREATE DATABASE student_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Ortam değişkenlerini ayarlayın (örnek):

```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_NAME=student_tracker
export DB_USER=root
export DB_PASS=
export APP_ORIGIN=http://localhost:5173
```

3. Şema ve başlangıç verilerini yükleyin:

```bash
cd /home/runner/work/student/student/backend
php init_db.php
```

Bu adım varsayılan admin kullanıcısını da oluşturur:

- E-posta: `admin@example.com`
- Şifre: `admin123`

4. API’yi çalıştırın:

```bash
cd /home/runner/work/student/student/backend
php -S localhost:8000 index.php
```

## Frontend Kurulumu

```bash
cd /home/runner/work/student/student/frontend
npm install
npm run dev
```

Uygulama: `http://localhost:5173`

## Notlar

- Frontend API adresi varsayılan olarak `http://localhost:8000/api` kullanır.
- Farklı API adresi için `VITE_API_BASE` ortam değişkeni kullanılabilir.
