import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { EmployeeManagement } from './features/employee-management/employee-management';
import { StockDetails } from './features/stock-details/stock-details';
import { StockIn } from './features/stock-in/stock-in';
import { StockOut } from './features/stock-out/stock-out';
import { BranchDetails } from './features/branch-details/branch-details';
import { StockLedger } from './features/stock-ledger/stock-ledger';
import { SessionService } from '../../services/session';

@Component({
  standalone: true,
  selector: 'app-main',
  imports: [
    CommonModule,
    RouterModule,
    EmployeeManagement,
    StockDetails,
    StockIn,
    StockOut,
    BranchDetails,
    StockLedger
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main implements OnInit {
  sidebarOpen = false;
  Username: string = '';
  CompanyName: string = '';
  tenantid: number = 0;
  sessionLoaded = false;
  navItems = [
    { id: 'employee', title: 'Employee management' },
    { id: 'stock-details', title: 'Stock details' },
    { id: 'stock-in', title: 'Stock in' },
    { id: 'stock-out', title: 'Stock out' }
  ] as const;

  constructor(
    private auth: Auth,
    private router: Router,
    private session: SessionService
  ) {}

  ngOnInit() {
    const data = this.session.value;
    if (!data) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.CompanyName = data.companyName ?? '';
    this.Username = data.name ?? '';
    this.tenantid = data.tenantID ?? 0;
    this.sessionLoaded = true;
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.session.clear();
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.session.clear();
        this.router.navigateByUrl('/login');
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

}
