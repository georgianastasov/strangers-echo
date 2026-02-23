import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrls: ['./stats.css'],
})
export class StatsComponent implements OnInit, OnDestroy {
  public echoes: any[] = [];

  private firestore: Firestore = inject(Firestore);
  private unsubscribe: any;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    const clicksRef = collection(this.firestore, 'clicks');
    const q = query(clicksRef, orderBy('timestamp', 'desc'), limit(10));

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.echoes = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data['timestamp'] ? data['timestamp'].toDate() : new Date();
        return {
          location: data['location'] || 'Unknown',
          time: date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };
      });
      this.cdr.detectChanges();
    });
  }

  public ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  public goBack() {
    this.router.navigate(['/']);
  }
}
