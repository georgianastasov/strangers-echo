import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBf8PhQsBCGK3RdxgmV0k9ezqqsLTEVLxU",
  authDomain: "strangers-echo.firebaseapp.com",
  projectId: "strangers-echo",
  storageBucket: "strangers-echo.firebasestorage.app",
  messagingSenderId: "44352452787",
  appId: "1:44352452787:web:9a99d3d61c7859ac7b98c6"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore())
  ]
};