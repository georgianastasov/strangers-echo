import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home';
import { FirestoreService } from '../firestore.service';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let routerSpy: jasmine.SpyObj<Router>;
  let fssStub: jasmine.SpyObj<FirestoreService>;

  beforeEach(async () => {
    fssStub = jasmine.createSpyObj('FirestoreService', [
      'collection', 'doc', 'query', 'orderBy', 'limit',
      'addDoc', 'getDocs', 'runTransaction', 'serverTimestamp', 'onSnapshot',
    ]);
    fssStub.collection.and.returnValue({} as any);
    fssStub.doc.and.returnValue({} as any);
    fssStub.query.and.returnValue({} as any);
    fssStub.orderBy.and.returnValue({} as any);
    fssStub.limit.and.returnValue({} as any);
    fssStub.serverTimestamp.and.returnValue(null);
    fssStub.addDoc.and.returnValue(Promise.resolve({} as any));
    fssStub.getDocs.and.returnValue(Promise.resolve({ empty: true, docs: [] } as any));
    fssStub.runTransaction.and.callFake(async (cb: any) => {
      const tx = {
        get: async () => ({ exists: () => false, data: () => null }),
        set: (_ref: any, _data: any) => {},
      };
      return cb(tx);
    });

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: FirestoreService, useValue: fssStub },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    localStorage.clear();
    fixture.detectChanges();
  });

  it('should trigger Abyss mode after 7 seconds of holding', fakeAsync(() => {
    component.onButtonDown(new Event('mousedown'));

    tick(4000);
    expect(component.isPulsing()).toBe(true);

    tick(3000);
    expect(component.isAbyssMode()).toBe(true);
    expect(component.isPulsing()).toBe(false);
  }));

  it('should initialize with cooldown if found in localStorage', fakeAsync(() => {
    const future = Date.now() + 60000;
    localStorage.setItem('echo_cooldown', future.toString());

    component.ngOnInit();
    tick(1000);

    expect(component.isPressed()).toBe(true);
    expect(component.buttonText()).not.toBe('TOUCH');

    component.ngOnDestroy();
  }));

  it('pressButton should update signals on success', fakeAsync(async () => {
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve(new Response(JSON.stringify({ city: 'Sofia', country: 'Bulgaria' }))),
    );

    await component.pressButton();

    expect(component.buttonText()).toBe('TOUCHED');
    expect(component.isPressed()).toBe(true);
  }));
});
