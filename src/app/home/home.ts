import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  public isPressed = false;
  public echoMessage = '';
  private previousClick: any = null;

  private firestore: Firestore = inject(Firestore);

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    const clicksRef = collection(this.firestore, 'clicks');
    const q = query(clicksRef, orderBy('timestamp', 'desc'), limit(1));

    onSnapshot(q, (snapshot) => {
      if (!snapshot.empty && !this.isPressed) {
        this.previousClick = snapshot.docs[0].data();
      }
    });
  }

  public async pressButton() {
    if (this.isPressed) return;

    this.isPressed = true;

    let currentLat: number | null = null;
    let currentLon: number | null = null;
    let location = 'Unknown';

    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      const geoData = await res.json();
      const city = geoData.city || '';
      const country = geoData.country || '';

      location =
        city && country ? `${city}, ${country}` : city ? city : country ? country : 'Unknown';

      if (geoData.latitude && geoData.longitude) {
        currentLat = parseFloat(geoData.latitude);
        currentLon = parseFloat(geoData.longitude);
      }
    } catch (error) {
      location = 'Unknown';
    }

    let message = 'You are the first to touch this.';

    if (this.previousClick && this.previousClick.timestamp) {
      const loc = this.previousClick.location || 'Unknown';
      const date = this.previousClick.timestamp.toDate();
      const timeAgo = this.getTimeAgo(date);

      let distanceText = '';
      if (
        currentLat !== null &&
        currentLon !== null &&
        this.previousClick.lat &&
        this.previousClick.lon
      ) {
        const distance = this.calculateDistance(
          currentLat,
          currentLon,
          this.previousClick.lat,
          this.previousClick.lon,
        );
        distanceText = ` (${distance}km away)`;
      }

      message = `Someone in ${loc}${distanceText} touched this ${timeAgo}.`;
    }

    setTimeout(() => {
      this.echoMessage = message;
      this.cdr.detectChanges();
    }, 600);

    try {
      const clicksRef = collection(this.firestore, 'clicks');
      await addDoc(clicksRef, {
        location: location,
        lat: currentLat,
        lon: currentLon,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      const clicksRef = collection(this.firestore, 'clicks');
      await addDoc(clicksRef, {
        location: 'Unknown',
        lat: null,
        lon: null,
        timestamp: serverTimestamp(),
      });
    }
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
      return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance).toLocaleString('en-US');
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  public goToStats() {
    this.router.navigate(['/stats']);
  }
}
