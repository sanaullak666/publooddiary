# PU Blood Diary

**An initiative by NSS Pondicherry University**

A full-stack, secure, professional, and responsive web application designed for Pondicherry University to maintain blood donor registrations and help facilitate donor access during medical emergencies.

---

## 🌟 Key Features

* **Donor Registration System**:
  * Captures Personal Details, Blood Group (including rare groups like *Bombay Blood Group (hh)* and *Rh-null*), University Register Number (unique constraint), Contact Info (10-digit Indian Mobile Validation), Email (unique constraint), State/UT, and Languages Known.
  * Searchable dropdown for all **45 Pondicherry University Departments and Schools**.
  * Dynamic conditional screening for regular health problems, regular medicine, and confidential lifestyle questions.
  * Required mandatory declaration agreement.
  
* **Update Last Donation Date**:
  * Secure donor lookup using Register Number or Email.
  * Allows updating *only* the **Last Blood Donated Date**. Profile details and health disclosures remain non-editable to preserve data integrity.
  
* **Public Blood Donor Search**:
  * Safe public donor search interface allowing filtered search by Blood Group, Department, and State/UT.
  * Strictly excludes all sensitive medical disclosures and lifestyle questions.

* **Admin Portal & Management Dashboard**:
  * Password-authenticated Admin Login with `bcrypt` password hashing and secure Express session management.
  * Multi-field real-time searching and simultaneous multi-filtering (Blood Group, Department, State/UT, Language, Date range, Health/Medicine/Substance status).
  * Modal viewer for complete donor profile (accessible only to authorized administrators).
  * Edit and Delete capabilities with confirmation dialogs.
  * Export options: **CSV**, **Excel**, and **Print / PDF Printable View**.
  * **Activity Audit Logs**: Tracks every admin action (Logins, Profile Views, Edits, Deletions, Exports) with timestamp and IP address.

* **Privacy & Security**:
  * Strict separation of public donor matching and private admin records.
  * Prepared/parameterized SQL statements to prevent SQL injection.
  * Security headers via `Helmet`.
  * Rate-limiting on authentication and registration endpoints to prevent brute force.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, CSS3 (Custom CSS Design System, HSL palette, dark/light contrast), Vanilla JavaScript.
* **Backend**: Node.js, Express.js (MVC Architecture).
* **Database**: MySQL (with automatic local SQLite fallback for out-of-the-box local testing).
* **Security & Auth**: `bcryptjs`, `express-session`, `helmet`, `cors`, `express-rate-limit`.

---

## 📂 Project Architecture

```
bloodpu/
├── config/
│   └── database.js         # Database pool & dual-mode MySQL/SQLite engine
├── controllers/
│   ├── adminController.js  # Admin auth, donor CRUD, activity logs, export
│   └── donorController.js  # Donor registration, lookup, donation date updates, search
├── middleware/
│   ├── authMiddleware.js   # Session authentication guard
│   ├── rateLimiter.js      # Rate limit protection
│   └── validation.js       # Input validation & sanitization
├── models/
│   ├── adminModel.js       # Admin queries & auth methods
│   ├── donorModel.js       # Donor database queries & filtering
│   └── logModel.js         # Activity logging queries
├── public/
│   ├── css/
│   │   └── style.css       # Design system & responsive styles
│   ├── images/
│   │   └── logo.svg        # PU & NSS logo icon
│   └── js/
│       ├── main.js         # Registries, toast system, modal & date helpers
│       ├── register.js     # Dynamic registration form logic
│       ├── update-donation.js # Donation date update logic
│       ├── search.js       # Public donor search logic
│       └── admin.js        # Admin dashboard tables, filters, CRUD & exports
├── routes/
│   ├── adminRoutes.js      # Protect Admin API endpoints
│   ├── donorRoutes.js      # Donor API endpoints
│   └── viewRoutes.js       # Page rendering routes
├── utils/
│   ├── exportHelper.js     # CSV/Excel export formatter
│   └── seed.js             # Initial database seeder
├── views/
│   ├── index.html          # Home Page
│   ├── register.html       # Donor Registration Page
│   ├── update-donation.html# Update Donation Record Page
│   ├── search.html         # Public Donor Search Page
│   ├── admin-login.html    # Admin Login Page
│   └── admin-dashboard.html# Admin Dashboard Page
├── .env.example            # Environment variables template
├── .env                    # Environment configuration
├── app.js                  # Express application setup
├── server.js               # Application entry point
├── package.json            # NPM dependencies & scripts
└── schema.sql              # MySQL Database Schema & SQL Scripts
```

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **MySQL Server** (Recommended for production deployment)

### 2. Installation
Clone or navigate to the project directory:
```bash
cd bloodpu
npm install
```

### 3. Database Configuration

#### Option A: MySQL Database Setup (Production)
1. Open MySQL terminal or phpMyAdmin.
2. Run the `schema.sql` script to create the database and seed initial admin credentials:
   ```bash
   mysql -u root -p < schema.sql
   ```
3. Update your `.env` file with your MySQL credentials:
   ```env
   PORT=3000
   SESSION_SECRET=pu_blood_directory_nss_secret_key_2026_pondicherry_university
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=pu_blood_db
   ```

#### Option B: Automatic Fallback Mode (Development/Testing)
If MySQL is not currently running locally, the application automatically initializes a local SQLite database (`database/pu_blood.db`) and seeds initial donor and administrator records so the web app runs seamlessly out of the box!

### 4. Running the Application
Start the server:
```bash
npm start
```

Access the application in your browser:
* **Home Page**: `http://localhost:3000`
* **Donor Registration**: `http://localhost:3000/register`
* **Update Last Donation Date**: `http://localhost:3000/update-donation`
* **Public Donor Search**: `http://localhost:3000/search`
* **Admin Login**: `http://localhost:3000/admin/login`

---

## 🔑 Default Admin Credentials

* **Username**: `admin`
* **Password**: `Password@123`

*(Password is hashed using bcrypt in database)*

---

## 📄 License & Copyright

**© Pondicherry University. All Rights Reserved.**
An initiative by NSS Pondicherry University.
