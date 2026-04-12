import {TestBed} from '@angular/core/testing';
import {App} from './app';

describe('App', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(async () => {
    const storage = new Map<string, string>();

    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => {
          storage.clear();
        },
      },
    });

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: originalLocalStorage});
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows google sign-in call to action when firebase is configured', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Takvimde gunluk takibinizi gormek icin Google ile giris yapin');
  });

  it('shows signed-out calendar placeholder by default', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Google ile giris yaptiginizda burada gunluk zikir takviminiz gorunecek');
  });

  it('hides install button after app installation', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.showInstallButton.set(true);

    app.onAppInstalled();

    expect(app.showInstallButton()).toBe(false);
  });
});
