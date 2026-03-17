import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  PLATFORM_ID,
  Injectable,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'iptv-theme';
  readonly theme = signal<ThemeMode>(this.getInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      const activeTheme = this.theme();
      const root = this.document.documentElement;

      root.setAttribute('data-theme', activeTheme);
      root.classList.toggle('dark', activeTheme === 'dark');
      root.style.colorScheme = activeTheme;
      window.localStorage.setItem(this.storageKey, activeTheme);
    });
  }

  toggleTheme(): void {
    this.theme.update((currentTheme) =>
      currentTheme === 'dark' ? 'light' : 'dark',
    );
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
  }

  private getInitialTheme(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) {
      return 'dark';
    }

    const savedTheme = window.localStorage.getItem(this.storageKey);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
