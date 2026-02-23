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

  private firestore: Firestore = inject(Firestore);

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    const clicksRef = collection(this.firestore, 'clicks');
    const q = query(clicksRef, orderBy('timestamp', 'desc'), limit(1));

    onSnapshot(q, (snapshot) => {
      if (!snapshot.empty && this.isPressed) {
        const data = snapshot.docs[0].data();
        const location = data['location'] || 'Unknown';

        setTimeout(() => {
          this.echoMessage = `Someone in ${location} touched this just now.`;
          this.cdr.detectChanges();
        }, 600);
      }
    });
  }

  public async pressButton() {
    if (this.isPressed) return;

    this.isPressed = true;

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

  public goToStats() {
    this.router.navigate(['/stats']);
  }
}