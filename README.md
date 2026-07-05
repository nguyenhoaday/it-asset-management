# 🖥️ ITAM — IT Asset Management System

Hệ thống quản lý tài sản CNTT (IT Asset Management) toàn diện cho tổ chức, bao gồm theo dõi thiết bị, cấp phát, bảo trì, kiểm kê, quản lý bản quyền phần mềm và phân tích sức khỏe tài sản.

[![CI Build](https://img.shields.io/badge/CI%20Build-passing-brightgreen)]()
[![Java](https://img.shields.io/badge/Java-21-orange)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-green)]()
[![React](https://img.shields.io/badge/React-19-blue)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)]()

---

## 📋 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt & Chạy (Docker)](#-cài-đặt--chạy-docker---khuyến-nghị)
- [Cài đặt & Chạy (Development)](#-cài-đặt--chạy-môi-trường-phát-triển)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Biến môi trường](#-biến-môi-trường)
- [Tài liệu kỹ thuật](#-tài-liệu-kỹ-thuật)

---

## ✨ Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 🔐 **Xác thực & Phân quyền** | JWT + Refresh Token (HttpOnly Cookie), 3 vai trò: SUPER_ADMIN / IT_STAFF / EMPLOYEE |
| 📦 **Quản lý Tài sản** | CRUD đầy đủ, mã tự sinh, soft delete, lịch sử luân chuyển, QR Code |
| 🔄 **Cấp phát / Thu hồi / Điều chuyển** | Luồng xác nhận (PENDING → CONFIRMED), nhân viên có thể từ chối |
| 🏆 **Care Score Gamification** | Điểm uy tín nhân viên (0–100): +5đ xác nhận, -5đ từ chối, -10đ bảo trì, +1đ/ngày tự động |
| 🔧 **Bảo trì** | Mở/đóng phiếu bảo trì, ghi nhận chi phí và nhà cung cấp, xuất báo cáo PDF |
| 📊 **Kiểm kê QR** | Quét QR offline (PWA), lưu IndexedDB, tự động batch sync khi có mạng |
| 💻 **Quản lý Bản quyền** | Theo dõi số seat, cấp phát phần mềm, cảnh báo hết hạn |
| 💡 **Asset Health Score** | Điểm sức khỏe 0–100 theo 4 yếu tố: tuổi đời, bảo hành, sự cố, trạng thái |
| 📈 **Dashboard & Báo cáo** | KPI Cards, biểu đồ phân bổ Recharts, xuất Excel/PDF |
| 🔔 **Thông báo Dual-Path** | Real-time WebSocket In-App notification + Async Redis Email Queue |
| 🌏 **Đa ngôn ngữ** | Tiếng Việt và Tiếng Anh (i18next) |
| 🌙 **Dark Mode** | Chế độ tối/sáng tùy chỉnh |
| 📱 **PWA & Offline** | Cài đặt PWA, Service Worker precaching (`sw.js`) |

---

## 🏛️ Kiến trúc hệ thống

```text
┌─────────────────┐  REST / WebSocket  ┌──────────────────────────────────┐
│  React 19 PWA   │ ◄────────────────► │  Spring Boot 4.1 (Modular Mono)  │
│(Vite + Tailwind)│    JWT / Cookie    │                                  │
└────────┬────────┘                    │  IAM │ Asset │ Allocation         │
         │                             │  Inventory │ Maintenance          │
         │ Offline PWA                 │  License │ Report │ Notification  │
         ▼                             └──────────────┬───────────────────┘
   📱 QR Mobile Scan                                  │ JPA / Jedis
   💾 IndexedDB                               ┌───────┴────────┐
                                              ▼                ▼
                                        ┌───────────┐    ┌───────────┐
                                        │PostgreSQL │    │  Redis 7  │
                                        │    15+    │    │Email Queue│
                                        └───────────┘    └───────────┘
```

**Tech Stack:**
- **Frontend:** React 19, Vite 8, Tailwind CSS 4, Recharts, React Router 7, i18next, Lucide Icons
- **Backend:** Spring Boot 4.1, Java 21, Spring Security + JWT, Spring Data JPA, Spring Mail
- **Database:** PostgreSQL 15 (JSONB cho dynamic schema), Redis 7 (email queue)
- **Infrastructure:** Docker, Nginx

---

## 📋 Yêu cầu hệ thống

### Chạy với Docker (Khuyến nghị)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- 4 GB RAM trở lên

### Chạy Development
- **Java 21** (OpenJDK / Eclipse Temurin)
- **Node.js 20+** và npm
- **PostgreSQL 15+**
- **Redis 7+**
- Maven (hoặc dùng `./mvnw` wrapper có sẵn)

---

## 🐳 Cài đặt & Chạy Docker — Khuyến nghị

### Bước 1: Clone repository
```bash
git clone https://github.com/nguyenhoaday/it-asset-management.git
cd it-asset-management
```

### Bước 2: Tạo file `.env` từ template
```bash
cp .env.example .env
```

Mở `.env` và điền các giá trị bắt buộc:
```env
POSTGRES_PASSWORD=your_strong_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_very_long_random_secret_at_least_64_chars
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your_gmail_app_password
```

> 💡 **Tạo JWT_SECRET:** `openssl rand -base64 64` hoặc bất kỳ chuỗi ngẫu nhiên ≥ 64 ký tự

### Bước 3: Khởi động tất cả services
```bash
docker compose up -d
```

### Bước 4: Chờ services sẵn sàng (~60 giây)
```bash
# Xem logs backend
docker compose logs -f backend

# Kiểm tra trạng thái
docker compose ps
```

### Bước 5: Truy cập ứng dụng
| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost |
| 🔌 Backend API | http://localhost:8080/api/v1 |
| 🗄️ Database | localhost:5432 (dùng pgAdmin, user: `itam_user`) |

### Dừng và xóa containers
```bash
# Dừng (giữ data)
docker compose down

# Dừng và XÓA toàn bộ data (cẩn thận!)
docker compose down -v
```

---

## 💻 Cài đặt & Chạy môi trường Phát triển

### 1. Database (PostgreSQL + Redis)
```bash
# Chạy chỉ DB với Docker
docker compose up postgres redis -d
```

Hoặc cài đặt local và chạy script khởi tạo:
```bash
psql -U postgres -c "CREATE DATABASE itam_db;"
psql -U postgres -c "CREATE USER itam_user WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE itam_db TO itam_user;"
# Script init DB sẽ được chạy tự động bởi Hibernate (ddl-auto=validate với Liquibase/Flyway)
# Hoặc chạy thủ công: psql -U itam_user -d itam_db -f scripts/init_schema.sql
```

### 2. Backend (Spring Boot)
```bash
cd itam-backend

# Cài đặt biến môi trường (Windows PowerShell)
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/itam_db"
$env:SPRING_DATASOURCE_USERNAME="itam_user"
$env:SPRING_DATASOURCE_PASSWORD="password"
$env:SPRING_DATA_REDIS_HOST="localhost"
$env:JWT_SECRET="dev-secret-key-at-least-64-characters-long-for-development"

# Chạy backend
.\mvnw.cmd spring-boot:run
```
Backend khởi động tại: **http://localhost:8080**

### 3. Frontend (Vite + React)
```bash
cd itam-frontend

# Cài đặt dependencies
npm install

# Chạy dev server
npm run dev
```
Frontend khởi động tại: **http://localhost:5173**

### 4. Build kiểm tra
```bash
# Backend
cd itam-backend && .\mvnw.cmd compile

# Frontend
cd itam-frontend && npm run build
```

---

## 🔑 Tài khoản mặc định

Sau khi database được khởi tạo:

| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| `admin` | `Admin@123456` | SUPER_ADMIN |

> ⚠️ **Bảo mật:** Đổi mật khẩu admin ngay sau khi đăng nhập lần đầu!

---

## 📁 Cấu trúc dự án

```
it-asset-management/
├── 📂 scripts/                      # SQL scripts (init DB, recovery)
├── 📂 itam-backend/                 # Spring Boot Backend
│   ├── Dockerfile
│   ├── src/main/java/com/nguyenhoa/itam/
│   │   ├── iam/                     # Module: Users, Departments, Roles
│   │   ├── asset/                   # Module: Assets, Categories, Health
│   │   ├── allocation/              # Module: Cấp phát, Thu hồi, Điều chuyển
│   │   ├── maintenance/             # Module: Bảo trì
│   │   ├── inventory/               # Module: Kiểm kê
│   │   ├── license/                 # Module: Bản quyền phần mềm
│   │   ├── notification/            # Module: Thông báo & Email
│   │   ├── report/                  # Module: Báo cáo & Xuất file
│   │   ├── systemconfig/            # Module: Cấu hình hệ thống
│   │   ├── audit/                   # Module: Nhật ký thay đổi
│   │   └── common/                  # Shared: DTOs, Exceptions, Security
│   └── src/main/resources/
│       └── application.yml
├── 📂 itam-frontend/                # React PWA Frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── docker-entrypoint.sh
│   └── src/
│       ├── pages/                   # Các trang chính
│       ├── components/              # Các component tái sử dụng
│       ├── services/                # Axios API client
│       ├── context/                 # React Contexts (Toast, Auth)
│       └── locales/                 # Bản dịch vi.json, en.json
├── docker-compose.yml               # Orchestration toàn bộ system
├── .env.example                     # Template biến môi trường
└── README.md
```

---

## ⚙️ Biến môi trường

Xem file [`.env.example`](.env.example) để biết đầy đủ các biến.

### Biến bắt buộc

| Biến | Mô tả |
|------|-------|
| `POSTGRES_PASSWORD` | Mật khẩu PostgreSQL |
| `REDIS_PASSWORD` | Mật khẩu Redis |
| `JWT_SECRET` | Khóa ký JWT (≥ 64 ký tự ngẫu nhiên) |

### Biến tuỳ chọn (có giá trị mặc định)

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `POSTGRES_DB` | `itam_db` | Tên database |
| `POSTGRES_USER` | `itam_user` | User database |
| `APP_FRONTEND_URL` | `http://localhost` | URL frontend (để cấu hình CORS & cookie) |
| `APP_COOKIE_SECURE` | `false` | `true` khi dùng HTTPS production |
| `JWT_EXPIRATION_MS` | `900000` | Thời hạn Access Token (15 phút) |
| `SPRING_MAIL_HOST` | `smtp.gmail.com` | SMTP server |

---

## 🏥 Asset Health Score

Điểm sức khỏe tài sản được tính theo công thức đa yếu tố:

```
HealthScore = 30%×AgeFactor + 20%×WarrantyFactor + 30%×IncidentFactor + 20%×ConditionFactor
```

| Yếu tố | Công thức |
|--------|-----------|
| **Age** | Linear decay theo vòng đời (mặc định 60 tháng) |
| **Warranty** | 100 nếu còn bảo hành, 0 nếu hết |
| **Incident** | `100 × 0.8^n` (n = số lần bảo trì) |
| **Condition** | 100 (bình thường), 50 (đang bảo trì), 0 (hỏng/mất/thanh lý) |

Trọng số và vòng đời có thể điều chỉnh trong **Settings → Cấu hình Sức khỏe** (chỉ SUPER_ADMIN).

---

## 🛠️ Lệnh hữu ích

```bash
# Xem logs realtime
docker compose logs -f [postgres|redis|backend|frontend]

# Rebuild một service
docker compose up -d --build backend

# Vào shell container backend
docker compose exec backend sh

# Backup database
docker compose exec postgres pg_dump -U itam_user itam_db > backup.sql

# Restore database
docker compose exec -T postgres psql -U itam_user itam_db < backup.sql

# Reset admin password (emergency)
docker compose exec backend sh -c "curl -X POST http://localhost:8080/api/v1/auth/emergency-reset \
  -H 'Content-Type: application/json' \
  -d '{\"emergencyPassword\": \"<APP_ADMIN_EMERGENCY_RESET_PASSWORD>\"}'"
```

