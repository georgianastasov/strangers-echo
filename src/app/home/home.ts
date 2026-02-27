import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  runTransaction,
} from '@angular/fire/firestore';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public isPressed = signal(false);
  public echoMessage = signal('');
  public milestoneMessage = signal('');
  public buttonText = signal('TOUCH');

  private previousClick: any = null;
  private cooldownInterval: any;
  private firestore: Firestore = inject(Firestore);

  constructor(private router: Router) {}

  public ngOnInit() {
    this.checkCooldown();
  }

  public ngOnDestroy() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  private checkCooldown() {
    const cooldownEnd = localStorage.getItem('echo_cooldown');
    if (cooldownEnd) {
      const endTime = parseInt(cooldownEnd, 10);
      if (endTime > Date.now()) {
        this.isPressed.set(true);
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
        this.isPressed.set(false);
        this.buttonText.set('TOUCH');
        this.echoMessage.set('');
        this.milestoneMessage.set('');
        localStorage.removeItem('echo_cooldown');
      } else {
        const m = Math.floor(remaining / 60)
          .toString()
          .padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        this.buttonText.set(`${m}:${s}`);

        if (isFromLoad) {
          this.echoMessage.set(`Your echo is traveling.`);
        }
      }
    }, 1000);
  }

  private playMysticSound() {
    const audio = new Audio('sounds/sound.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => {});
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

  public async pressButton() {
    if (this.isPressed()) return;

    this.playMysticSound();
    this.isPressed.set(true);
    this.buttonText.set('TOUCHED');

    let currentLat: number | null = null;
    let currentLon: number | null = null;
    let location = 'Unknown';
    let city = 'Unknown';
    let country = 'Unknown';

    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      const geoData = await res.json();
      city = geoData.city || '';
      country = geoData.country || '';

      location =
        city && country ? `${city}, ${country}` : city ? city : country ? country : 'Unknown';

      if (geoData.latitude && geoData.longitude) {
        currentLat = parseFloat(geoData.latitude);
        currentLon = parseFloat(geoData.longitude);
      }
    } catch (error) {
      location = 'Unknown';
    }

    try {
      const clicksRef = collection(this.firestore, 'clicks');
      const qLatest = query(clicksRef, orderBy('timestamp', 'desc'), limit(1));
      const latestSnap = await getDocs(qLatest);

      if (!latestSnap.empty) {
        this.previousClick = latestSnap.docs[0].data();
      }
    } catch (error) {}

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

      const statsRef = doc(this.firestore, 'global_stats', 'data');
      let totalClicks = 0;

      await runTransaction(this.firestore, async (transaction) => {
        const docSnap = await transaction.get(statsRef);
        const data = docSnap.exists()
          ? docSnap.data()
          : {
              totalTracked: 0,
              recentTimestamps: [],
              countries: {},
              cities: {},
              dates: {},
              times: [0, 0, 0, 0],
              recentWhispers: [],
              mapData: {},
            };

        data['totalTracked'] += 1;
        totalClicks = data['totalTracked'];

        const now = Date.now();
        data['recentTimestamps'].push(now);
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        data['recentTimestamps'] = data['recentTimestamps'].filter((t: number) => t > oneDayAgo);

        const ctry = country || 'Unknown';
        data['countries'][ctry] = (data['countries'][ctry] || 0) + 1;

        const cty = city || 'Unknown';
        data['cities'][cty] = (data['cities'][cty] || 0) + 1;

        const dateStr = new Date(now).toLocaleDateString([], { month: 'short', day: 'numeric' });
        data['dates'][dateStr] = (data['dates'][dateStr] || 0) + 1;

        const hour = new Date(now).getHours();
        let timeIndex = 3;
        if (hour >= 0 && hour < 6) timeIndex = 0;
        else if (hour >= 6 && hour < 12) timeIndex = 1;
        else if (hour >= 12 && hour < 18) timeIndex = 2;
        data['times'][timeIndex] += 1;

        const timeStr = new Date(now).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        data['recentWhispers'].unshift({
          location: location,
          time: timeStr,
          timestamp: now,
          lat: currentLat,
          lon: currentLon,
        });

        if (data['recentWhispers'].length > 5) {
          data['recentWhispers'] = data['recentWhispers'].slice(0, 5);
        }

        if (currentLat !== null && currentLon !== null) {
          const key = `${currentLat}_${currentLon}`;
          if (data['mapData'][key]) {
            data['mapData'][key].count += 1;
          } else {
            data['mapData'][key] = { lat: currentLat, lon: currentLon, count: 1, name: location };
          }
        }

        transaction.set(statsRef, data);
      });

      setTimeout(() => {
        const milestones = [10, 50, 100, 1000, 10000, 100000, 1000000, 10000000];
        const isMilestone = milestones.includes(totalClicks);

        if (isMilestone) {
          this.milestoneMessage.set(
            `YOU ARE THE ${totalClicks.toLocaleString()}TH PERSON TO TOUCH THIS`,
          );
          this.echoMessage.set('');
          this.fireRedConfetti();
        } else {
          this.echoMessage.set(normalMessage);
          this.milestoneMessage.set('');
        }

        const endTime = Date.now() + 60000;
        localStorage.setItem('echo_cooldown', endTime.toString());
        this.startCooldownTimer(endTime, false);
      }, 600);
    } catch (error) {
      setTimeout(() => {
        this.echoMessage.set(normalMessage);
        const endTime = Date.now() + 60000;
        localStorage.setItem('echo_cooldown', endTime.toString());
        this.startCooldownTimer(endTime, false);
      }, 600);
    }
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

  public goToStats() {
    this.router.navigate(['/stats']);
  }
}
