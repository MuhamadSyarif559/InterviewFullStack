import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messageSignal = signal('');
  private readonly visibleSignal = signal(false);
  private readonly typeSignal = signal<ToastType>('info');
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  message = this.messageSignal.asReadonly();
  visible = this.visibleSignal.asReadonly();
  type = this.typeSignal.asReadonly();

  show(message: string, type: ToastType = 'info', durationMs = 1800) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.messageSignal.set(message);
    this.typeSignal.set(type);
    this.visibleSignal.set(true);

    if (durationMs > 0) {
      this.hideTimer = setTimeout(() => {
        this.visibleSignal.set(false);
      }, durationMs);
    }
  }

  hide() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.visibleSignal.set(false);
  }
}
