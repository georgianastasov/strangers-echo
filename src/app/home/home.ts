import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
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
  getCountFromServer,
} from '@angular/fire/firestore';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public isPressed = false;
  public echoMessage = '';
  public milestoneMessage = '';
  public buttonText = 'TOUCH';
  private previousClick: any = null;
  private cooldownInterval: any;

  private firestore: Firestore = inject(Firestore);

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    this.checkCooldown();

    const clicksRef = collection(this.firestore, 'clicks');
    const q = query(clicksRef, orderBy('timestamp', 'desc'), limit(1));

    onSnapshot(q, (snapshot) => {
      if (!snapshot.empty && !this.isPressed) {
        this.previousClick = snapshot.docs[0].data();
      }
    });
  }

  public ngOnDestroy() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  public async pressButton() {
    if (this.isPressed) return;

    this.playMysticSound();

    this.isPressed = true;
    this.buttonText = 'TOUCHED';

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

    let normalMessage = 'You are the first to touch this.';

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

      normalMessage = `Someone in ${loc}${distanceText} touched this ${timeAgo}.`;
    }

    try {
      const clicksRef = collection(this.firestore, 'clicks');
      await addDoc(clicksRef, {
        location: location,
        lat: currentLat,
        lon: currentLon,
        timestamp: serverTimestamp(),
      });

      const countSnapshot = await getCountFromServer(clicksRef);
      const totalClicks = countSnapshot.data().count;

      setTimeout(() => {
        const milestones = [10, 50, 100, 1000, 10000, 100000, 1000000, 10000000];
        const isMilestone = milestones.includes(totalClicks);

        if (isMilestone) {
          this.milestoneMessage = `YOU ARE THE ${totalClicks.toLocaleString()}TH PERSON TO TOUCH THIS`;
          this.echoMessage = '';
          this.fireRedConfetti();
        } else {
          this.echoMessage = normalMessage;
          this.milestoneMessage = '';
        }

        const endTime = Date.now() + 60000;
        localStorage.setItem('echo_cooldown', endTime.toString());
        this.startCooldownTimer(endTime, false);
        this.cdr.detectChanges();
      }, 600);
    } catch (error) {
      setTimeout(() => {
        this.echoMessage = normalMessage;
        const endTime = Date.now() + 60000;
        localStorage.setItem('echo_cooldown', endTime.toString());
        this.startCooldownTimer(endTime, false);
        this.cdr.detectChanges();
      }, 600);
    }
  }

  public goToStats() {
    this.router.navigate(['/stats']);
  }

  private checkCooldown() {
    const cooldownEnd = localStorage.getItem('echo_cooldown');
    if (cooldownEnd) {
      const endTime = parseInt(cooldownEnd, 10);
      if (endTime > Date.now()) {
        this.isPressed = true;
        this.startCooldownTimer(endTime, true);
      } else {
        localStorage.removeItem('echo_cooldown');
      }
    }
  }

  private startCooldownTimer(endTime: number, isFromLoad: boolean) {
    this.cooldownInterval = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);

      if (remaining <= 0) {
        clearInterval(this.cooldownInterval);
        this.isPressed = false;
        this.buttonText = 'TOUCH';
        this.echoMessage = '';
        this.milestoneMessage = '';
        localStorage.removeItem('echo_cooldown');
        this.cdr.detectChanges();
      } else {
        const m = Math.floor(remaining / 60)
          .toString()
          .padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        this.buttonText = `${m}:${s}`;

        if (isFromLoad) {
          this.echoMessage = `Your echo is traveling.`;
        }
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  private playMysticSound() {
    const audio = new Audio('sounds/sound.mp3');
    audio.volume = 0.8;
    audio.play().catch((error) => {
      console.log('Audio playback failed:', error);
    });
  }

  private fireRedConfetti() {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.75 },
      colors: ['#ff0000', '#800000', '#ff4d4d', '#ffffff'],
      disableForReducedMotion: true,
    });
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
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
    return Math.round(R * c).toLocaleString('en-US');
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
