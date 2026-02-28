import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StatsComponent } from './stats';
import { FirestoreService } from '../firestore.service';

describe('StatsComponent', () => {
  let fixture: ComponentFixture<StatsComponent>;
  let component: StatsComponent;
  let snapshotCb: ((snap: any) => void) | null = null;
  let unsubscribed = false;
  let fssStub: jasmine.SpyObj<FirestoreService>;

  beforeEach(async () => {
    fssStub = jasmine.createSpyObj('FirestoreService', ['doc', 'onSnapshot']);
    fssStub.doc.and.returnValue({} as any);
    fssStub.onSnapshot.and.callFake((_ref: any, cb: any) => {
      snapshotCb = cb;
      unsubscribed = false;
      return () => {
        unsubscribed = true;
      };
    });

    const routerStub = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.overrideComponent(StatsComponent, {
      set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] },
    });

    await TestBed.configureTestingModule({
      imports: [StatsComponent],
      providers: [
        { provide: FirestoreService, useValue: fssStub },
        { provide: Router, useValue: routerStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;

    spyOn(component, 'initMap').and.stub();

    fixture.detectChanges();
  });

  afterEach(() => {
    snapshotCb = null;
    unsubscribed = false;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initEmptyCharts sets baseline chart structures', () => {
    component.initEmptyCharts();
    expect(component.timelineChartOptions).toBeDefined();
    expect(component.countryChartOptions).toBeDefined();
    expect(component.cityChartOptions).toBeDefined();
    expect(component.timeOfDayOptions).toBeDefined();
    expect(Array.isArray(component.timelineChartOptions.series)).toBe(true);
    expect(Array.isArray(component.timeOfDayOptions.series)).toBe(true);
  });

  it('processChartData builds chart series and categories from inputs', () => {
    (component as any).topCities = [
      { name: 'CityA', count: 5 },
      { name: 'CityB', count: 3 },
    ];

    const dateCounts = { '2026-02-20': 2, '2026-02-21': 4 };
    const countryCounts = { X: 7, Y: 2, Z: 1 };
    const timeDistribution = [1, 2, 3, 4];

    component.processChartData(dateCounts, countryCounts, timeDistribution);

    const tSeries = component.timelineChartOptions.series!;
    const tAxis = component.timelineChartOptions.xaxis!;
    expect(tSeries[0].data).toEqual([2, 4]);
    expect(tAxis.categories).toEqual(['2026-02-20', '2026-02-21']);

    const cSeries = component.countryChartOptions.series!;
    const cAxis = component.countryChartOptions.xaxis!;
    expect(cSeries[0].data).toEqual([7, 2, 1]);
    expect(Array.isArray(cAxis.categories)).toBe(true);
  });

  it('calculateDistanceRaw returns 0 for identical coordinates', () => {
    const d = (component as any).calculateDistanceRaw(10, 20, 10, 20);
    expect(d).toBe(0);
  });

  it('updateMap clears markersLayer and handles whispers without coords', () => {
    const clearSpy = jasmine.createSpy('clearLayers');
    (component as any).markersLayer = { clearLayers: clearSpy } as any;

    const locationMap = new Map<string, any>();
    const whispers = [
      { lat: null, lon: null },
      { lat: null, lon: null },
    ];

    component.updateMap(locationMap, null, whispers);
    expect(clearSpy).toHaveBeenCalled();
  });

  it('ngOnInit onSnapshot populates signals and computed values', fakeAsync(() => {
    expect(snapshotCb).toBeDefined();

    const now = Date.now();
    const data = {
      totalTracked: 10,
      recentTimestamps: [now, now],
      recentWhispers: [{ location: 'Sofia, Bulgaria', lat: 42.7, lon: 23.3, timestamp: now }],
      cities: { Sofia: 5 },
      countries: { Bulgaria: 8 },
      dates: { D1: 2 },
      times: [1, 2, 3, 4],
    };

    if (snapshotCb) {
      snapshotCb({
        exists: () => true,
        data: () => data,
      });
    }

    tick(200);

    expect(component.totalTracked()).toBe(10);
    expect(component.chartsReady()).toBe(true);
  }));

  it('goBack navigates to root', () => {
    const router = TestBed.inject(Router);
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('ngOnDestroy unsubscribes from onSnapshot', () => {
    component.ngOnDestroy();
    expect(unsubscribed).toBe(true);
  });
});
