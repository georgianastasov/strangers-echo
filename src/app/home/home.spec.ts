import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import * as af from '@angular/fire/firestore';
import { HomeComponent } from './home';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let navigateSpy: Mock;
  let clicksRef = {};
  let snapshotCb: Function | null = null;

  beforeEach(async () => {
    vi.spyOn(af, 'collection').mockReturnValue(clicksRef as any);
    vi.spyOn(af, 'query').mockImplementation((...args: any[]) => ({ qargs: args }) as any);
    vi.spyOn(af, 'orderBy').mockImplementation((...args: any[]) => ({ order: args }) as any);
    vi.spyOn(af, 'limit').mockImplementation((...args: any[]) => ({ limit: args }) as any);
    vi.spyOn(af, 'serverTimestamp').mockReturnValue('SERVER_TIMESTAMP' as any);

    vi.spyOn(af, 'onSnapshot').mockImplementation((q: any, cb: any) => {
      snapshotCb = cb;
      return () => {};
    });

    vi.spyOn(af, 'addDoc').mockResolvedValue({} as any);

    const routerStub = { navigate: vi.fn() };
    navigateSpy = routerStub.navigate;

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: af.Firestore, useValue: {} },
        { provide: Router, useValue: routerStub },
        { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('pressButton should fetch geo and write city, country to Firestore', fakeAsync(async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ city: 'Sofia', country: 'Bulgaria' }),
    } as Response);

    await component.pressButton();

    expect(af.addDoc).toHaveBeenCalledTimes(1);
    const calls = vi.mocked(af.addDoc).mock.calls;
    const calledWith = calls[calls.length - 1][1] as any;

    expect(calledWith.location).toBe('Sofia, Bulgaria');
    expect(calledWith.timestamp).toBe('SERVER_TIMESTAMP');
    expect(component.isPressed).toBe(true);
  }));

  it('pressButton should write Unknown when geo fetch fails', fakeAsync(async () => {
    vi.spyOn(window, 'fetch').mockRejectedValue('fail');

    vi.mocked(af.addDoc).mockClear();

    await component.pressButton();

    expect(af.addDoc).toHaveBeenCalledTimes(1);
    const calls = vi.mocked(af.addDoc).mock.calls;
    const calledWith = calls[calls.length - 1][1] as any;

    expect(calledWith.location).toBe('Unknown');
  }));

  it('ngOnInit onSnapshot should update echoMessage when isPressed and snapshot arrives', fakeAsync(() => {
    component.isPressed = true;

    const fakeDoc = {
      data: () => ({ location: 'Plovdiv, Bulgaria' }),
    };
    expect(snapshotCb).toBeDefined();

    if (snapshotCb) {
      snapshotCb({ empty: false, docs: [fakeDoc] });
    }

    tick(600);
    expect(component.echoMessage).toContain('Plovdiv, Bulgaria');
  }));

  it('goToStats navigates to /stats', () => {
    component.goToStats();
    expect(navigateSpy).toHaveBeenCalledWith(['/stats']);
  });
});
