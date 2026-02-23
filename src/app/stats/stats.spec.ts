import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import * as af from '@angular/fire/firestore';
import { StatsComponent } from './stats';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('StatsComponent', () => {
  let fixture: ComponentFixture<StatsComponent>;
  let component: StatsComponent;
  let snapshotCb: Function | null = null;
  let unsubscribed = false;

  beforeEach(async () => {
    vi.spyOn(af, 'collection').mockReturnValue({} as any);
    vi.spyOn(af, 'query').mockImplementation((...args: any[]) => ({ qargs: args }) as any);
    vi.spyOn(af, 'orderBy').mockImplementation((...args: any[]) => ({ order: args }) as any);
    vi.spyOn(af, 'limit').mockImplementation((...args: any[]) => ({ limit: args }) as any);

    vi.spyOn(af, 'onSnapshot').mockImplementation((q: any, cb: any) => {
      snapshotCb = cb;
      unsubscribed = false;
      return () => {
        unsubscribed = true;
      };
    });

    const routerStub = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [StatsComponent],
      providers: [
        { provide: af.Firestore, useValue: {} },
        { provide: Router, useValue: routerStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit onSnapshot populates echoes list with formatted times', () => {
    const now = new Date(2020, 0, 1, 12, 34, 56);
    const fakeTimestamp = { toDate: () => now };

    const fakeDoc = {
      data: () => ({ location: 'Sofia, Bulgaria', timestamp: fakeTimestamp }),
    };

    expect(snapshotCb).toBeDefined();

    if (snapshotCb) {
      snapshotCb({ docs: [fakeDoc] });
    }

    expect(component.echoes.length).toBe(1);
    expect(component.echoes[0].location).toBe('Sofia, Bulgaria');
    expect(component.echoes[0].time).toContain('12');
    expect(component.echoes[0].time).toContain('34');
    expect(component.echoes[0].time).toContain('56');
  });

  it('ngOnDestroy unsubscribes', () => {
    component.ngOnDestroy();
    expect(unsubscribed).toBe(true);
  });

  it('goBack navigates to root', () => {
    const router = TestBed.inject(Router);
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
