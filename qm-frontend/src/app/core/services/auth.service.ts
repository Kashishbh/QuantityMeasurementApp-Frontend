import { Injectable, computed, signal } from '@angular/core';
import type { MeasurementSession } from '../models/measurement.models';

const STORAGE_KEY = 'qm_auth_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<MeasurementSession | null>(this.readSession());

  readonly user = computed(() => this.session());
  readonly isSignedIn = computed(() => this.session() !== null);
  readonly isGuest = computed(() => this.session()?.isGuest ?? false);
  readonly isRegistered = computed(() => {
    const s = this.session();
    return s !== null && !s.isGuest;
  });

  /**
   * History viewing requires a registered account (not the guest session).
   * Saving history is allowed for guests (handled separately in UI/service).
   */
  readonly canViewHistory = computed(() => this.isRegistered());

  constructor() {
    this.syncFromStorage();
    window.addEventListener('storage', () => this.syncFromStorage());
  }

  loginAsGuest(): void {
    this.setSession({ userName: 'Guest', isGuest: true });
  }

  login(userName: string, _password: string): void {
    this.setSession({ userName: userName.trim() || 'User', isGuest: false });
  }

  signup(userName: string, _password: string): void {
    this.setSession({ userName: userName.trim() || 'User', isGuest: false });
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  private setSession(session: MeasurementSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  private readSession(): MeasurementSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as MeasurementSession;
      if (typeof parsed?.userName === 'string') {
        return { userName: parsed.userName, isGuest: Boolean(parsed.isGuest) };
      }
      return null;
    } catch {
      return null;
    }
  }

  private syncFromStorage(): void {
    this.session.set(this.readSession());
  }
}
