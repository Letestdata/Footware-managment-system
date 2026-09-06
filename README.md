# ?? Nice Footware Management System

A full-featured Point of Sale (POS) and inventory management system for a footwear retail store, built with **React + Vite** and packaged as a native **Android/iOS** mobile app using **Capacitor**.

---

## ? Features

### ?? Employee Panel
| Module | Description |
|--------|-------------|
| **Dashboard** | Today''s revenue, total transactions, average order value, recent sales, login history |
| **Sales (POS)** | Process new transactions, apply discounts, manage returns & exchanges, revenue trends, payment method breakdown |
| **Orders** | View and manage all customer orders, process returns/exchanges |
| **Inventory** | Browse products, check stock levels, add/edit/delete products |
| **Customers** | Customer list, purchase history, add new customers |
| **Reports** | Sales reports, top products by revenue, export CSV |
| **Messages** | Internal messaging system |
| **Notifications** | Low-stock alerts and order notifications |
| **Settings** | Update profile password, app theme (dark/light mode) |
| **Login History** | View recent login activity |

### ??? Admin Panel
| Module | Description |
|--------|-------------|
| **Admin Dashboard** | Revenue charts, top-selling products, order trends |
| **Admin Sales** | Full sales view, revenue trend (last 7 days), payment methods, recent transactions |
| **Admin Orders** | Manage all orders, process returns & exchanges |
| **Admin Inventory** | Full product management (add, edit, delete, stock tracking) |
| **Admin Customers** | Customer database management |
| **Admin Employees** | Add/remove staff accounts, assign roles |
| **Admin Reports** | Advanced reports with CSV export and EOD Report printing |
| **Admin Messages** | Read and respond to messages from employees |
| **Admin Notifications** | System-wide notifications |
| **Activity Logs** | Full audit trail of orders and customer activity |
| **Admin Settings** | Store details, admin profile management |

---

## ??? Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | Frontend framework |
| **Vite 8** | Build tool |
| **React Router DOM 7** | Client-side routing |
| **Firebase Firestore** | Cloud database (NoSQL) |
| **Firebase Auth** | (Configured, available for use) |
| **Chart.js 4** | Revenue & analytics charts |
| **Capacitor 8** | Native Android & iOS wrapper |
| **@capacitor/filesystem** | Save CSV/PDF files on device |
| **@capacitor/share** | Share files via native share sheet |
| **@capacitor/preferences** | Store login credentials locally |

---

## ?? Platform Support

- ? **Web Browser** (Chrome, Edge, Safari)
- ? **Android** (via Capacitor + Android Studio)
- ? **iOS** (via Capacitor + Xcode — requires macOS)

---

## ?? Getting Started

### Prerequisites
- Node.js (v18+)
- Android Studio (for Android builds)
- Xcode on macOS (for iOS builds)

### 1. Clone the Repository
```bash
git clone https://github.com/Letestdata/Nice-footware-iso.git
cd nice-footware-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Firebase
Open `src/firebase.js` and replace the config object with **your own Firebase project credentials**:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> ?? IMPORTANT: Never commit real Firebase credentials to a public repository. Use environment variables (.env) for production.

### 4. Run in Development
```bash
npm run dev
```

### 5. Build and Sync for Mobile
```bash
npm run build
npm run cap:sync
```

### 6. Open in Android Studio
```bash
npx cap open android
```

### 7. Open in Xcode (macOS only)
```bash
npx cap open ios
```

---

## ?? Firebase Setup

This project uses **Firebase Firestore** as its NoSQL cloud database.
Go to Firebase Console ? Your Project ? Firestore Database ? Start collection.

---

### ?? Required Firestore Collections

#### 1. `users`
Stores employee and admin accounts used for login.

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Unique login username |
| `password` | string | Login password |
| `name` | string | Full display name |
| `role` | string | "admin" or "employee" |
| `email` | string | User email address |
| `phone` | string | Contact phone number |
| `createdAt` | timestamp | Account creation date |

---

#### 2. `products`
The inventory/product catalog.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name (e.g., "Nike Air Max 270") |
| `sku` | string | Unique product SKU code |
| `category` | string | Category (e.g., "Running", "Casual") |
| `price` | number | Selling price (INR) |
| `stock` | number | Current units in stock |
| `status` | string | "In Stock", "Low Stock", or "Out of Stock" |
| `imageUrl` | string | (Optional) URL to product image |
| `createdAt` | timestamp | When the product was added |

---

#### 3. `orders`
Stores every transaction/receipt made at the POS.

| Field | Type | Description |
|-------|------|-------------|
| `receiptId` | string | Unique invoice ID (e.g., "#INV-2026-1234") |
| `customer` | string | Customer name or "Walk-in Customer" |
| `phone` | string | Customer phone number |
| `productName` | string | Name of the purchased product |
| `sku` | string | Product SKU |
| `itemCount` | number | Quantity purchased |
| `price` | number | Unit price |
| `totalAmount` | number | Grand total (INR) |
| `discount` | number | Discount amount applied |
| `paymentMethod` | string | "Cash", "Credit Card", or "UPI / Digital" |
| `status` | string | "Paid", "Completed", "Refunded", "Exchanged" |
| `createdAt` | timestamp | Transaction date/time |

---

#### 4. `customers`
Customer contact database.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Customer full name |
| `phone` | string | Primary phone number |
| `email` | string | Email address |
| `address` | string | Delivery/billing address |
| `totalPurchases` | number | Total amount spent (INR) |
| `createdAt` | timestamp | When the customer was first added |

---

#### 5. `login_history`
Audit log for all login attempts (success and failure).

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | The username that attempted login |
| `name` | string | User display name ("Unknown" on failure) |
| `status` | string | "Success" or "Failed" |
| `createdAt` | timestamp | Timestamp of the login attempt |

---

#### 6. `notifications`
Stores system notifications (e.g., low-stock alerts).

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Notification title |
| `message` | string | Notification body text |
| `type` | string | "low_stock", "order", etc. |
| `read` | boolean | Whether the notification has been read |
| `createdAt` | timestamp | When the notification was created |

---

#### 7. `messages`
Internal chat messages between employees and admin.

| Field | Type | Description |
|-------|------|-------------|
| `sender` | string | Username of the sender |
| `senderName` | string | Display name of the sender |
| `text` | string | Message content |
| `createdAt` | timestamp | Timestamp of the message |

---

#### 8. `storeSettings`
Stores global store configuration set by the admin.

| Field | Type | Description |
|-------|------|-------------|
| `storeName` | string | Store display name |
| `address` | string | Store physical address |
| `phone` | string | Store contact number |
| `email` | string | Store email address |
| `taxRate` | number | Tax percentage to apply |
| `currency` | string | Currency symbol (e.g., "INR") |

---

## ?? Firebase Security Rules (Recommended)

In the Firebase Console, go to **Firestore ? Rules** and set:

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

## ?? Project Structure

```
nice-footware-system/
+-- src/
¦   +-- Login/          # Login page
¦   +-- admin/          # Admin panel screens
¦   ¦   +-- css/        # Admin-specific CSS
¦   +-- employee/       # Employee panel screens
¦   +-- components/     # Shared reusable components
¦   +-- css/            # Shared CSS (themes, layouts)
¦   +-- firebase.js     # Firebase initialization
¦   +-- App.jsx         # Root app with routing
¦   +-- main.jsx        # App entry point
+-- android/            # Capacitor Android project
+-- ios/                # Capacitor iOS project
+-- public/             # Static assets
+-- capacitor.config.ts # Capacitor configuration
+-- vite.config.js      # Vite build configuration
+-- package.json
```

---

## ????? Developer Notes

- After every code change, run `npm run build && npm run cap:sync` before opening in Android Studio / Xcode.
- The app supports **Dark Mode** and **Light Mode** using CSS variables.
- The app is fully **responsive** for both mobile and desktop views.
- Native features (file saving, sharing, printing) use Capacitor plugins and only work inside the native app.

---

## ?? License

This project is private and proprietary. All rights reserved by **Nice Footware**.
