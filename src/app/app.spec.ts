import {TestBed} from '@angular/core/testing';
import {App} from './app';

describe('App', () => {
  const originalUserAgent = window.navigator.userAgent;
  const originalPlatform = window.navigator.platform;
  const originalMaxTouchPoints = window.navigator.maxTouchPoints;
  const originalLocalStorage = globalThis.localStorage;

  const setNavigator = (userAgent: string, platform = 'Win32', maxTouchPoints = 0) => {
    Object.defineProperty(window.navigator, 'userAgent', {configurable: true, value: userAgent});
    Object.defineProperty(window.navigator, 'platform', {configurable: true, value: platform});
    Object.defineProperty(window.navigator, 'maxTouchPoints', {configurable: true, value: maxTouchPoints});
  };

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
    setNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36');

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  afterAll(() => {
    Object.defineProperty(window.navigator, 'userAgent', {configurable: true, value: originalUserAgent});
    Object.defineProperty(window.navigator, 'platform', {configurable: true, value: originalPlatform});
    Object.defineProperty(window.navigator, 'maxTouchPoints', {configurable: true, value: originalMaxTouchPoints});
    Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: originalLocalStorage});
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows install help fallback on iOS Safari', () => {
    setNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', 'iPhone', 5);

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app.showInstallHelpButton()).toBe(true);
    expect(app.installHelpTitle()).toContain('iPhone');
  });

  it('hides install controls after app installation', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.showInstallButton.set(true);
    app.showInstallHelpButton.set(true);
    app.showInstallHelp.set(true);

    app.onAppInstalled();

    expect(app.showInstallButton()).toBe(false);
    expect(app.showInstallHelpButton()).toBe(false);
    expect(app.showInstallHelp()).toBe(false);
  });
});
