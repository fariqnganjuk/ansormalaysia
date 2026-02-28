# Welcome to Your Miaoda Project
Miaoda Application Link URL
    URL:https://medo.dev/projects/app-9wnpatirc0e9

# Welcome to Your Miaoda Project

## Project Info

## Project Directory

```
├── README.md # Documentation
├── components.json # Component library configuration
├── index.html # Entry file
├── package.json # Package management
├── postcss.config.js # PostCSS configuration
├── public # Static resources directory
│   ├── favicon.png # Icon
│   └── images # Image resources
├── src # Source code directory
│   ├── App.tsx # Entry file
│   ├── components # Components directory
│   ├── context # Context directory
│   ├── db # Database configuration directory
│   ├── hooks # Common hooks directory
│   ├── index.css # Global styles
│   ├── layout # Layout directory
│   ├── lib # Utility library directory
│   ├── main.tsx # Entry file
│   ├── routes.tsx # Routing configuration
│   ├── pages # Pages directory
│   ├── services # Database interaction directory
│   ├── types # Type definitions directory
├── tsconfig.app.json # TypeScript frontend configuration file
├── tsconfig.json # TypeScript configuration file
├── tsconfig.node.json # TypeScript Node.js configuration file
└── vite.config.ts # Vite configuration file
```

## Tech Stack

Vite, TypeScript, React, PHP, MySQL

## Backend PHP + MySQL Setup (XAMPP)

1. Import schema MySQL dari `backend/database/schema.sql` ke database MySQL Anda.
2. Pastikan folder project berada di dalam `htdocs`, contoh: `C:/xampp/htdocs/ANSORMALAYSIA`.
3. Jalankan Apache + MySQL dari XAMPP.
4. Set environment variable backend (opsional, default sudah disediakan di `backend/config.php`):

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=ansormalaysia_app
MYSQL_USER=root
MYSQL_PASSWORD=
FRONTEND_ORIGIN=http://localhost:5173

# Optional: sumber data eksternal KP2MI (Malaysia)
# Jika tidak diisi / gagal diakses, sistem otomatis fallback ke data internal (tabel infographics)
KP2MI_MALAYSIA_DATA_URL=
KP2MI_CACHE_TTL_SECONDS=1800

# Optional (Tahap 2): sesuaikan struktur payload KP2MI yang nested
# Contoh: response.data.items -> isi dengan "data.items"
KP2MI_RESPONSE_PATH=

# Optional (Tahap 2): override field mapping, dipisah koma,
# mendukung nested key (contoh: negara.kode, coordinate.lat)
KP2MI_FIELD_TITLE=title,judul,name,nama
KP2MI_FIELD_IMAGE_URL=image_url,image,gambar,thumbnail,img_url
KP2MI_FIELD_DESCRIPTION=description,deskripsi,desc,ringkasan
KP2MI_FIELD_LOCATION=location_name,lokasi,wilayah,state,province,kota,city
KP2MI_FIELD_DATA_TYPE=data_type,type,kategori,metric
KP2MI_FIELD_LATITUDE=latitude,lat,coordinate.lat
KP2MI_FIELD_LONGITUDE=longitude,lng,lon,coordinate.lng
KP2MI_FIELD_DATA_VALUE=data_value,value,jumlah,total,count
KP2MI_FIELD_CREATED_AT=created_at,updated_at,tanggal,date
KP2MI_FIELD_COUNTRY=country,country_name,negara,kode_negara,countryCode,negara.kode
KP2MI_FIELD_COUNTRY_CODE=country_code,countryCode,kode_negara,negara.kode
```

5. Frontend akan membaca endpoint API dari `VITE_API_BASE_URL`.
    Gunakan `.env` di root project:

```
VITE_API_BASE_URL=http://localhost/ANSORMALAYSIA/backend
```

## Data Bootstrap (Opsional)

## Integrasi Data KP2MI (Malaysia)

- Endpoint publik aplikasi untuk konsumsi frontend: `GET /backend/index.php?route=/infographics/public`
- Paksa refresh cache eksternal: `GET /backend/index.php?route=/infographics/public&refresh=1`
- Strategi data: `external-first` (KP2MI) lalu `internal-fallback` (database lokal)
- Cache file disimpan di `backend/.cache/kp2mi-malaysia-infographics.json`
- Endpoint admin `GET /infographics` tetap data internal agar CRUD admin tidak terganggu

### 1) Seed data awal

Jalankan setelah `schema.sql`:

```
mysql -u root -p ansormalaysia_app < backend/database/seed.sql
```

### 2) Buat / reset akun admin lokal

```
php backend/database/create_admin.php admin passwordku123
```

## Development Guidelines

### How to edit code locally?

You can choose [VSCode](https://code.visualstudio.com/Download) or any IDE you prefer. The only requirement is to have Node.js and npm installed.

### Environment Requirements

```
# Node.js ≥ 20
# npm ≥ 10
Example:
# node -v   # v20.18.3
# npm -v    # 10.8.2
```

### Installing Node.js on Windows

```
# Step 1: Visit the Node.js official website: https://nodejs.org/, click download. The website will automatically suggest a suitable version (32-bit or 64-bit) for your system.
# Step 2: Run the installer: Double-click the downloaded installer to run it.
# Step 3: Complete the installation: Follow the installation wizard to complete the process.
# Step 4: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.
```

### Installing Node.js on macOS

```
# Step 1: Using Homebrew (Recommended method): Open Terminal. Type the command `brew install node` and press Enter. If Homebrew is not installed, you need to install it first by running the following command in Terminal:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
Alternatively, use the official installer: Visit the Node.js official website. Download the macOS .pkg installer. Open the downloaded .pkg file and follow the prompts to complete the installation.
# Step 2: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.
```

### After installation, follow these steps:

```
# Step 1: Download the code package
# Step 2: Extract the code package
# Step 3: Open the code package with your IDE and navigate into the code directory
# Step 4: In the IDE terminal, run the command to install dependencies: npm i
# Step 5: In the IDE terminal, run the command to start the development server: npm run dev -- --host 127.0.0.1
# Step 6: if step 5 failed, try this command to start the development server: npx vite --host 127.0.0.1
```

### How to develop backend services?

Configure environment variables and use MySQL as the data store for the PHP backend.

## Learn More

You can also check the help documentation: Download and Building the app（ [https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en](https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en)）to learn more detailed content.
