import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { TabService } from '../../services/tab';
import { EmployeeManagement } from './features/employee-management/employee-management';
import { StockDetails } from './features/stock-details/stock-details';
import { StockIn } from './features/stock-in/stock-in';
import { StockOut } from './features/stock-out/stock-out';
import { BranchDetails } from './features/branch-details/branch-details';

@Component({
  standalone: true,
  selector: 'app-main',
  imports: [
    CommonModule,
    EmployeeManagement,
    StockDetails,
    StockIn,
    StockOut,
    BranchDetails
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main implements OnInit {
  sidebarOpen = false;
  Username: string = '';
  CompanyName: string = '';
  navItems = [
    { id: 'employee', title: 'Employee management' },
    { id: 'stock-details', title: 'Stock details' },
    { id: 'stock-in', title: 'Stock in' },
    { id: 'stock-out', title: 'Stock out' },
    { id: 'branch', title: 'Branch details' }
  ] as const;

  constructor(
    private auth: Auth,
    private router: Router,
    public tabs: TabService
  ) {}

  ngOnInit() {
    this.auth.me().subscribe({
      next: (response) => {
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        this.CompanyName = data?.companyName ?? '';
        this.Username = data?.name ?? '';
        console.log('works', data);
        console.log('company name', this.CompanyName);
      },
      error: () => this.router.navigateByUrl('/login')
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }

  openTab(id: string, title: string) {
    this.tabs.open(id, title);
    this.sidebarOpen = false;
  }

  closeTab(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.tabs.close(id);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }
}
