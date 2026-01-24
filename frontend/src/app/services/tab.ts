import { Injectable, signal } from '@angular/core';

export interface TabItem {
  id: string;
  title: string;
}

@Injectable({ providedIn: 'root' })
export class TabService {
  private readonly tabsSignal = signal<TabItem[]>([]);
  private readonly activeIdSignal = signal<string | null>(null);

  tabs = this.tabsSignal.asReadonly();
  activeId = this.activeIdSignal.asReadonly();

  open(id: string, title: string) {
    const current = this.tabsSignal();
    const exists = current.find((tab) => tab.id === id);

    if (!exists) {
      this.tabsSignal.set([...current, { id, title }]);
    }
    this.activeIdSignal.set(id);
  }

  select(id: string) {
    const current = this.tabsSignal();
    if (current.some((tab) => tab.id === id)) {
      this.activeIdSignal.set(id);
    }
  }

  close(id: string) {
    const current = this.tabsSignal();
    const index = current.findIndex((tab) => tab.id === id);
    if (index === -1) return;

    const nextTabs = current.filter((tab) => tab.id !== id);
    this.tabsSignal.set(nextTabs);

    if (this.activeIdSignal() === id) {
      const nextActive = nextTabs[index] ?? nextTabs[index - 1] ?? null;
      this.activeIdSignal.set(nextActive ? nextActive.id : null);
    }
  }

  closeAll() {
    this.tabsSignal.set([]);
    this.activeIdSignal.set(null);
  }
}
