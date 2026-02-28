# 🔴 Strangers Echo

> A real-time global connection experiment & advanced analytics dashboard, wrapped in a breathtaking 3D Glassmorphism UI.

https://strangers-echo.web.app/

## 📖 The Concept
**Strangers Echo** starts with a very simple premise: A single, mystic red button. 
When you touch it, your location is recorded, and the screen reveals who touched the button right before you and how long ago. It’s a fleeting, real-time connection with a complete stranger somewhere else on the planet.

But behind this simple button lies a **powerful command center**. The app tracks global interactions and visualizes them in a high-tech, real-time dashboard.

## ✨ Key Features

### 🎛️ The Core Experience (Home)
* **One-Touch Connection:** A massive, 3D glassmorphic button with complex inset shadows and a rotating red gradient.
* **Automatic Geolocation:** Uses IP-based geolocation (GeoJS) to seamlessly detect the user's city and country without intrusive browser prompts.
* **Real-Time "Echoes":** Instantly calculates and displays the time elapsed since the previous global click (e.g., *"Someone in Tokyo, Japan touched this 2 minutes ago"*).

### 📊 The Command Center (Stats Dashboard)
A full CSS-Grid dashboard powered by **ApexCharts** and Firebase real-time listeners:
* **Live Metrics:** Tracks clicks in the Last Hour, Last 24 Hours, and Total Tracked.
* **Activity Timeline:** A smooth area chart displaying click trends over recent days.
* **Global Reach:** Bar charts visualizing the Top 5 Countries and Top 5 Cities.
* **Time of Day Analysis:** A Donut chart breaking down activity into Night, Morning, Afternoon, and Evening.
* **Live Feed:** A constantly updating list of the newest whispers, featuring hover animations and glowing neon accents.

## 🎨 The Art of UI: Aggressive Red Glassmorphism
The entire application was designed with a heavy focus on modern, cutting-edge aesthetics:
* **Deep Space & Neon:** A `#0a0000` dark background with floating, blurred red and crimson orbs (`filter: blur(120px)`) that animate endlessly.
* **3D Glass Panels:** UI elements are built using `backdrop-filter: blur()`, complex multi-layered `box-shadows`, and translucent borders to simulate thick, carved glass.
* **Custom Scrollbars:** A sleek, glowing red scrollbar that perfectly matches the aggressive theme.

## 🛠️ Tech Stack
* **Frontend Framework:** Angular 21 (Standalone Components)
* **Backend & Database:** Firebase Cloud Firestore (Real-time snapshots)
* **Data Visualization:** ApexCharts (`ng-apexcharts`)
* **Styling:** Pure CSS (CSS Grid, Flexbox, Keyframe Animations, Glassmorphism)
* **Geolocation:** GeoJS API (IP-to-Location)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone
cd strangers-echo
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
For security reasons, the Firebase API keys are not included in this repository. You need to create your own Firebase project and add the configuration.
1. Create a src/environments/ folder.
2. Create a file named environment.ts inside it.
3. Add your Firebase credentials:
```bash
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
```

### 4. Run the development server
```bash
ng serve -o
```
The app will automatically open in your default browser at `http://localhost:4200`.

_Designed and built with passion._ 🔴
