# 🔴 Strangers Echo

> A real-time global connection experiment & advanced analytics dashboard, wrapped in a breathtaking 3D Glassmorphism UI.

Live Project: https://strangers-echo.web.app/

## 📖 The Concept

Strangers Echo starts with a very simple premise: A single, mystic red button.  
When you touch it, your approximate location is recorded, and the screen reveals who touched the button right before you, how long ago, and exactly how many kilometers away they were. It’s a fleeting, real-time connection with a complete stranger somewhere else on the planet.

But behind this simple button lies a powerful command center. The application anonymously tracks global interactions, calculates geographic distances using the Haversine formula, and visualizes the global spread of "echoes" in a high-tech, real-time dashboard.

## ✨ Key Features

### 🎛️ The Core Experience (Home)

**One-Touch Connection:** A massive, 3D glassmorphic button with complex inset shadows, a rotating red gradient, and a dynamic TOUCHING... loading state.

**Automatic Geolocation:** Uses IP-based geolocation (GeoJS) to seamlessly detect the user's city and country without intrusive browser prompts. Includes robust fallback error handling.

**Relational Distance Tracking:** The app fetches the immediate previous click from Firestore and calculates the exact distance (in km) between you and the previous stranger.

**Audio-Visual Feedback:** A satisfying mystic audio chime plays upon a successful database transaction.

**Global Milestones:** Features a custom canvas-confetti explosion for milestone clicks (e.g., the 10th, 100th, 1,000th person to touch the button).

**Smart Cooldown:** A 60-second cooldown timer utilizing localStorage prevents spam while showing a live countdown tick.

### 🕳️ The Abyss Mode (Hidden Easter Egg)

**Long-Press Mechanic:** Holding the button for 4 seconds triggers a violent UI pulse. Holding it for 7 seconds completely shatters the UI, throwing the user into "Abyss Mode".

**The Cipher Matrix:** A glitching, dark-mode terminal screen asking for a Decrypt Key.

**Reactive Input:** Typing the exact correct string instantly triggers a redirect to the creator's GitHub profile, acting as a hidden signature for the app.

### 📊 The Command Center (Stats Dashboard)

A full CSS-Grid dashboard powered by ApexCharts, Leaflet.js, and Firebase real-time listeners (onSnapshot):

**Live Metrics:** Tracks clicks in the Last Hour, Last 24 Hours, and Total Tracked.

**Interactive World Map:** A Leaflet-powered dark mode map dropping custom red markers on the exact coordinates of every echo.

**Activity Timeline:** A smooth area chart displaying click trends over recent days.

**Global Reach:** Bar charts visualizing the Top 5 Countries and Top 5 Cities.

**Time of Day Analysis:** A Donut chart breaking down activity into Night, Morning, Afternoon, and Evening shifts.

**Live Feed:** A constantly updating list of the newest whispers, featuring hover animations and glowing neon accents.

## 🎨 The Art of UI: Aggressive Red Glassmorphism

The entire application was designed with a heavy focus on modern, cutting-edge aesthetics:

**Deep Space & Neon:** A #0a0000 dark background with floating, blurred red and crimson orbs (filter: blur(120px)) that animate endlessly.

**Flawless Mobile Rendering:** Uses the modern 100dvh (Dynamic Viewport Height) property and a Flexbox sticky footer to ensure the UI never triggers unwanted scrollbars on mobile browsers.

**3D Glass Panels:** UI elements are built using backdrop-filter: blur(), complex multi-layered box-shadows, and translucent borders to simulate thick, carved glass.

## 🛠️ Tech Stack

**Frontend Framework:** Angular 21 (Strictly Typed, Standalone Components, Angular Signals for state management)

**Backend & Database:** Firebase Cloud Firestore (Real-time snapshots & Atomic Transactions)

**Data Visualization:** ApexCharts (ng-apexcharts)

**Mapping:** Leaflet.js

**Styling:** Pure CSS (CSS Grid, Flexbox, Keyframe Animations, Glassmorphism)

**Geolocation:** GeoJS API (IP-to-Location)

## 🚀 Getting Started

### 1. Clone the repository

```
git clone https://github.com/georgianastasov/strangers-echo.git
cd strangers-echo
```

### 2. Install dependencies

```
npm install
```

### 3. Configure Firebase

For security reasons, the Firebase API keys are not included in this repository. You need to create your own Firebase project and add the configuration.

Create a src/environments/ folder.

Create a file named environment.ts inside it.

Add your Firebase credentials:

```
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

```
npm run start
```

The app will automatically open in your default browser at http://localhost:4200.

### 5. Deployment (Firebase Hosting)

This project is pre-configured for Firebase Hosting. To deploy a production build:

```
npm run build
firebase deploy --only hosting
```

## ⚖️ License
This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact
Got questions, feedback, or a brilliant idea? Reach out!
**Email: ggeorgianastasov@gmail.com**

Designed and built with passion. 🔴
