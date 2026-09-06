# 👟 Nice Footware Management System

A full-featured **Point of Sale (POS)** and **Inventory Management System** built for a footwear retail store. Built with **React + Vite** and wrapped as a native **Android & iOS** mobile app using **Capacitor**.

---

## 📸 Project Overview

This system has **two separate panels**:
- **Employee Panel** - For store staff to handle sales, inventory, and customers
- **Admin Panel** - For the store owner to manage everything including employees, reports, and settings

---

## ✨ Features

### 👤 Employee Panel

| Module | Features |
|--------|----------|
| **Dashboard** | Today revenue, total transactions, average order value, recent sales activity, recent login history |
| **Sales (POS)** | Process new transactions, add products to cart, apply discounts, select payment method, process returns and exchanges, view revenue trend chart, payment method breakdown |
| **Orders** | View full order list, search/filter orders, view receipt details, process returns and exchanges |
| **Inventory** | Browse all products, check stock levels, filter by category/status, add new products, edit/delete products |
| **Customers** | View customer database, add new customers, view individual purchase history |
| **Reports** | Sales overview, top-selling products, revenue by payment method, export data to CSV, print EOD (End of Day) reports |
| **Messages** | Internal chat with admin |
| **Notifications** | Low-stock alerts, new order notifications |
| **Settings** | Change password, toggle dark/light mode |
| **Login History** | View recent successful and failed login attempts |

### 🛡️ Admin Panel

| Module | Features |
|--------|----------|
| **Admin Dashboard** | Revenue overview, weekly revenue chart, top-selling products, recent order activity |
| **Admin Sales** | Full sales history, last 7 days revenue trend chart, payment method breakdown, recent transactions search |
| **Admin Orders** | Manage all orders across all employees, process returns and exchanges |
| **Admin Inventory** | Full product CRUD (Create, Read, Update, Delete), stock level management |
| **Admin Customers** | Full customer database management, add/edit/delete customers |
| **Admin Employees** | Add new staff accounts, assign role (admin/employee), delete accounts |
| **Admin Reports** | Advanced sales reports, product performance, CSV export, Print EOD Report |
| **Admin Messages** | View and respond to messages from employees |
| **Admin Notifications** | View all system notifications |
| **Activity Logs** | Full audit trail of all orders and customer activity |
| **Admin Settings** | Update store information (name, address, phone), manage admin account |

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19 | Frontend UI framework |
| **Vite** | 8 | Build tool and dev server |
| **React Router DOM** | 7 | Client-side routing |
| **Firebase Firestore** | 12 | Cloud NoSQL database |
| **Firebase Auth** | 12 | Authentication service |
| **Chart.js** | 4 | Revenue and analytics charts |
| **Capacitor** | 8 | Native Android and iOS wrapper |
| **@capacitor/filesystem** | 8 | Save files (CSV, receipts) on device storage |
| **@capacitor/share** | 8 | Native file sharing (WhatsApp, Email, etc.) |
| **@capacitor/preferences** | 8 | Store login credentials locally on device |
| **Material Symbols** | - | Icon library (Google Icons) |
| **Vanilla CSS** | - | Styling with CSS variables for dark/light themes |

---

## 📱 Platform Support

| Platform | Status | Tool Required |
|----------|--------|---------------|
| **Web Browser** | Supported | Any modern browser |
| **Android** | Supported | Android Studio |
| **iOS** | Supported | Xcode (requires macOS) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Android Studio (for Android builds)
- Xcode on macOS (for iOS builds)
- A Firebase account

### Step 1 - Clone the Repository

```bash
git clone https://github.com/Letestdata/Footware-managment-system.git
cd Footware-managment-system
```

### Step 2 - Install Dependencies

```bash
npm install
```

### Step 3 - Configure Firebase

Open `src/firebase.js` and replace the placeholder values with your own Firebase project credentials.

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> WARNING: Never commit your real Firebase API keys to a public repository.
> For production, move your credentials into a .env file and add .env to your .gitignore.

### Step 4 - Run the App in Browser

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Step 5 - Build and Sync for Mobile

Run this command every time you make changes to the React code:

```bash
npm run build
npm run cap:sync
```

### Step 6 - Open in Android Studio

```bash
npx cap open android
```

### Step 7 - Open in Xcode (macOS only)

```bash
npx cap open ios
```

---

## 🔥 Firebase Firestore Setup

This project uses **Cloud Firestore** (NoSQL database) from Firebase.

**How to Create Collections:**
1. Go to Firebase Console (https://console.firebase.google.com/)
2. Select your project
3. Click Firestore Database from the left menu
4. Click Start collection
5. Create each collection listed below with the fields shown

---

## 📋 Firestore Collections and Fields

---

### Collection: `users`
Stores all employee and admin login accounts.

| Field Name | Data Type | Required | Description |
|-----------|-----------|----------|-------------|
| `username` | string | YES | Unique login username (e.g., "123") |
| `password` | string | YES | Login password |
| `name` | string | YES | Full display name (e.g., "ABC") |
| `role` | string | YES | Must be "admin" or "employee" |
| `email` | string | YES | User email address |
| `phone` | string | NO | Contact phone number |
| `createdAt` | timestamp | YES | Account creation date/time |

Example:
```json
{
  "username": "123",
  "password": "mypassword",
  "name": "ABC",
  "role": "admin",
  "email": "ahmad@footwear.com",
  "phone": "9876543210",
  "createdAt": "2026-01-01T10:00:00Z"
}
```

---

### Collection: `products`
The complete product inventory/catalog.

| Field Name | Data Type | Required | Description |
|-----------|-----------|----------|-------------|
| `name` | string | YES | Product name (e.g., "Nike Air Max 270") |
| `sku` | string | YES | Unique Stock Keeping Unit code (e.g., "NK-AM-270") |
| `category` | string | YES | Product category (e.g., "Running", "Casual", "Formal") |
| `price` | number | YES | Selling price in INR (e.g., 6999) |
| `stock` | number | YES | Current number of units available in stock |
| `status` | string | YES | "In Stock", "Low Stock", or "Out of Stock" |
| `imageUrl` | string | NO | URL to the product image |
| `createdAt` | timestamp | YES | Date/time the product was added |

Example:
```json
{
  "name": "Nike Air Max 270",
  "sku": "NK-AM-270-BLK",
  "category": "Running",
  "price": 12999,
  "stock": 18,
  "status": "In Stock",
  "imageUrl": "https://example.com/nike-air-max.jpg",
  "createdAt": "2026-01-15T09:30:00Z"
}
```

---

### Collection: `orders`
Every individual transaction/sale made at the POS counter. Each product sold creates one document.

| Field Name | Data Type | Required | Description |
|-----------|-----------|----------|-------------|
| `receiptId` | string | YES | Unique invoice ID shared across items in same sale (e.g., "#INV-2026-7538") |
| `customer` | string | YES | Customer name or "Walk-in Customer" for anonymous sales |
| `phone` | string | NO | Customer phone number |
| `productName` | string | YES | Name of the product sold |
| `sku` | string | YES | SKU of the product sold |
| `itemCount` | number | YES | Quantity of this product purchased |
| `price` | number | YES | Unit selling price of the product |
| `totalAmount` | number | YES | Grand total of the full transaction (INR) |
| `discount` | number | NO | Discount amount applied (default: 0) |
| `paymentMethod` | string | YES | "Cash", "Credit Card", or "UPI / Digital" |
| `status` | string | YES | "Paid", "Completed", "Refunded", or "Exchanged" |
| `createdAt` | timestamp | YES | Date/time of the transaction |

Example:
```json
{
  "receiptId": "#INV-2026-7538",
  "customer": "Rahul Sharma",
  "phone": "9876543210",
  "productName": "Skechers Go Walk",
  "sku": "SK-GW-001",
  "itemCount": 1,
  "price": 3999,
  "totalAmount": 6999,
  "discount": 500,
  "paymentMethod": "UPI / Digital",
  "status": "Paid",
  "createdAt": "2026-09-04T14:30:00Z"
}
```

---

### Collection: `customers`
The customer contact and purchase database.

| Field Name | Data Type | Required | Description |
|-----------|-----------|----------|-------------|
| `name` | string | YES | Customer full name |
| `phone` | string | YES | Primary contact phone number |
| `email` | string | NO | Customer email address |
| `address` | string | NO | Home or delivery address |
| `totalPurchases` | number | NO | Total amount spent by this customer (INR) |
| `createdAt` | timestamp | YES | Date when the customer was first added |

Example:
```json
{
  "name": "Priya Patel",
  "phone": "8254639972",
  "email": "priya@email.com",
  "address": "123 MG Road, Mumbai, Maharashtra",
  "totalPurchases": 24500,
  "createdAt": "2026-03-10T11:00:00Z"
}
```

---

### Collection: `login_history`
Audit log for every login attempt, both successful and failed.

| Field Name | Data Type | Required | Description |
|-----------|-----------|----------|-------------|
| `username` | string | YES | The username used in the login attempt |
| `name` | string | YES | Display name of the user ("Unknown" for failed attempts) |
| `status` | string | YES | "Success" or "Failed" |
| `createdAt` | timestamp | YES | Exact date/time of the login attempt |

Example:
```json
{
  "username": "ahmad123",
  "name": "Ahmad Ali",
  "status": "Success",
  "createdAt": "2026-09-06T08:15:00Z"
}
```

---

### Collection: `notifications`
System-generated notifications such as low stock alerts.

| Field Name | Data Type | Required | Description |
|-----------|-----------|----------|-------------|
| `title` | string | YES | Short notification title (e.g., "Low Stock Alert") |
| `message` | string | YES | Full notification message text |
| `type` | string | YES | "low_stock", "order", or "system" |
| `read` | boolean | YES | false = unread (shows badge), true = already read |
| `productId` | string | NO | ID of the related product (for low_stock alerts) |
| `createdAt` | timestamp | YES | Date/time the notification was created |

Example:
```json
{
  "title": "Low Stock Alert",
  "message": "Nike Air Max 270 is running low. Only 3 units remaining.",
  "type": "low_stock",
  "read": false,
  "productId": "abc123xyz",
  "createdAt": "2026-09-06T09:00:00Z"
}
```

---

### Collection: `messages`
Internal chat messages sent between employees and the admin.

| Field Name | Data Type | Required | Description |
|-----------|-----------|----------|-------------|
| `sender` | string | YES | Username of the person who sent the message |
| `senderName` | string | YES | Full display name of the sender |
| `senderRole` | string | NO | "admin" or "employee" |
| `text` | string | YES | The actual message content |
| `createdAt` | timestamp | YES | Date/time the message was sent |

Example:
```json
{
  "sender": "ahmad123",
  "senderName": "Ahmad Ali",
  "senderRole": "employee",
  "text": "The Nike stock is running low, please reorder.",
  "createdAt": "2026-09-06T10:30:00Z"
}
```

---

### Collection: `storeSettings`
Global store configuration managed by the admin. Should contain only ONE document.

| Field Name | Data Type | Required | Description |
|-----------|-----------|----------|-------------|
| `storeName` | string | YES | Official name of the store (e.g., "Nice Footware") |
| `address` | string | YES | Physical store address |
| `phone` | string | YES | Store contact number |
| `email` | string | NO | Store email address |
| `taxRate` | number | NO | Tax percentage to apply on sales (e.g., 18 for 18% GST) |
| `currency` | string | NO | Currency symbol (e.g., "INR") |
| `updatedAt` | timestamp | NO | Last time settings were updated |

Example:
```json
{
  "storeName": "Nice Footware",
  "address": "Shop No. 12, MG Road, Mumbai - 400001",
  "phone": "022-12345678",
  "email": "info@nicefootwear.com",
  "taxRate": 18,
  "currency": "INR",
  "updatedAt": "2026-09-01T12:00:00Z"
}
```

---

## 🔐 Firebase Security Rules

Go to Firebase Console > Firestore Database > Rules and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📁 Project Folder Structure

```
nice-footware-system/
├── src/
│   ├── Login/
│   │   ├── LogIn.jsx
│   │   └── LogIn.css
│   ├── admin/
│   │   ├── AdminDashbord.jsx
│   │   ├── AdminSales.jsx
│   │   ├── AdminOrders.jsx
│   │   ├── AdminInventory.jsx
│   │   ├── AdminCustomers.jsx
│   │   ├── AdminEmployees.jsx
│   │   ├── AdminReports.jsx
│   │   ├── AdminMessages.jsx
│   │   ├── AdminNotifications.jsx
│   │   ├── AdminActivityLogs.jsx
│   │   ├── AdminSettings.jsx
│   │   └── css/
│   ├── employee/
│   │   ├── Dashbord.jsx
│   │   ├── Sales.jsx
│   │   ├── Orders.jsx
│   │   ├── Inventory.jsx
│   │   ├── Customers.jsx
│   │   ├── Reports.jsx
│   │   ├── Messages.jsx
│   │   ├── Notifications.jsx
│   │   ├── Settings.jsx
│   │   └── LoginHistory.jsx
│   ├── css/
│   ├── firebase.js
│   ├── App.jsx
│   └── main.jsx
├── android/
├── ios/
├── public/
├── capacitor.config.ts
├── vite.config.js
└── package.json
```

---

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production app into dist/ |
| `npm run preview` | Preview the production build locally |
| `npm run cap:sync` | Copy dist/ into Android and iOS native projects |
| `npx cap open android` | Open the Android project in Android Studio |
| `npx cap open ios` | Open the iOS project in Xcode |

---

## 👨‍💻 Developer Notes

1. After every code change, always run `npm run build && npm run cap:sync` then rebuild the APK in Android Studio.
2. Dark Mode and Light Mode are fully supported using CSS custom properties.
3. Native features (file saving, sharing, CSV export, printing receipts) use Capacitor plugins and only work inside the native Android/iOS app.
4. Login Credentials (Remember Me feature) are stored on-device using @capacitor/preferences, NOT in Firestore.
5. App Logo is hosted at https://i.ibb.co/1pg7Nby/icon.png

---

## 📄 License

This project is private and proprietary.
All rights reserved 2026 Nice Footware.
