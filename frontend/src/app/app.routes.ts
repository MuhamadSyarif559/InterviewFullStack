import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Main } from './pages/main/main';
import { EmployeeManagement } from './pages/main/features/employee-management/employee-management';
import { StockDetails } from './pages/main/features/stock-details/stock-details';
import { ProductEditor } from './pages/main/features/stock-details/product-editor/product-editor';
import { StockIn } from './pages/main/features/stock-in/stock-in';
import { StockOut } from './pages/main/features/stock-out/stock-out';
import { BranchDetails } from './pages/main/features/branch-details/branch-details';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'main',
    component: Main,
    children: [
      { path: '', redirectTo: 'employee', pathMatch: 'full' },
      { path: 'employee', component: EmployeeManagement },
      { path: 'stock-details', component: StockDetails },
      { path: 'stock-details/new', component: ProductEditor },
      { path: 'stock-details/:id', component: ProductEditor },
      { path: 'stock-in', component: StockIn },
      { path: 'stock-out', component: StockOut },
      { path: 'branch', component: BranchDetails }
    ]
  },
  { path: '**', redirectTo: 'login' },
];
