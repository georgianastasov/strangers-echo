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

    let message = 'You are the first to touch this.';

    if (this.previousClick && this.previousClick.timestamp) {
      const loc = this.previousClick.location || 'Unknown';
      const date = this.previousClick.timestamp.toDate();
      const timeAgo = this.getTimeAgo(date);
      message = `Someone in ${loc} touched this ${timeAgo}.`;
    } else if (this.previousClick) {
      const loc = this.previousClick.location || 'Unknown';
      message = `Someone in ${loc} touched this recently.`;
    }

    setTimeout(() => {
      this.echoMessage = message;
      this.cdr.detectChanges();
    }, 600);

    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      const geoData = await res.json();
      const city = geoData.city || '';
      const country = geoData.country || '';

      const location =
        city && country ? `${city}, ${country}` : city ? city : country ? country : 'Unknown';

      const clicksRef = collection(this.firestore, 'clicks');
      await addDoc(clicksRef, {
        location: location,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      const clicksRef = collection(this.firestore, 'clicks');
      await addDoc(clicksRef, {
        location: 'Unknown',
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

  public goToStats() {
    this.router.navigate(['/stats']);
  }
}
