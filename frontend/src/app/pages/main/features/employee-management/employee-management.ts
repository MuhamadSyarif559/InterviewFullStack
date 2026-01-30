import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { EmployeeForm } from './employee-form';
import { Employee } from './employee.model';
import { UserApiResponse, UsersService } from '../../../../services/users';
import { Auth } from '../../../../services/auth';
import { ToastService } from '../../../../services/toast';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SessionService } from '../../../../services/session';


@Component({
  standalone: true,
  selector: 'app-employee-management',
  imports: [CommonModule, EmployeeForm],
  templateUrl: './employee-management.html',
  styleUrl: './employee-management.scss'
})
export class EmployeeManagement implements OnInit {
  employees$!: Observable<Employee[]>;
  filteredEmployees$!: Observable<Employee[]>;
  private searchTerm$ = new BehaviorSubject<string>('');
  loading = false;
  error = '';
  msg = '';

  selectedEmployee: Employee | null = null;
  formMode: 'add' | 'edit' = 'add';
  formOpen = false;

  currentUserId = 0;
  employmentStatus = 0;

  constructor(
    private auth: Auth,
    private router: Router,
    private toast: ToastService,
    private session: SessionService
  ) { }

  ngOnInit(): void {
    const session = this.session.value;
    this.currentUserId = session?.userId ?? 0;
    this.employmentStatus = session?.employmentStatus ?? 0;
    this.loadUsers();
  }

  openAdd(): void {
    if (this.employmentStatus === 1) return;
    this.formMode = 'add';
    this.selectedEmployee = null;
    this.formOpen = true;
  }

  openEdit(employee: Employee): void {
    if (this.employmentStatus === 1 && employee.id !== this.currentUserId) return;
    this.formMode = 'edit';
    this.selectedEmployee = employee;
    this.formOpen = true;
  }

  handleSave(employee: Employee): void {
    const normalized = this.normalizeEmployee(employee);
    const payload = this.toPayload(normalized);

    if (this.formMode === 'add') {
      const tenantID = payload.tenantID ?? 0;
      this.auth.register(
        payload.name,
        payload.companyName,
        payload.email!,
        payload.employmentStatus,
        payload.password!,
        tenantID
      ).subscribe({
        next: (res: string) => {
          const normalizedMsg = (res ?? '').toString().trim().replace(/^"|"$/g, '');
          this.msg = normalizedMsg;

          if (normalizedMsg.toLowerCase() === 'registered') {
            this.toast.show('Added Employee successfully.', 'success');
            this.loadUsers()
          }
        },
        error: (err) => {
          this.msg = err?.error ?? 'Register failed';
          this.toast.show('Unable to register.', 'error');
        }
      });
    } else {
      this.auth.updateUser(
        payload.id,
        {
          email: payload.email,
          name: payload.name,
          companyName: payload.companyName,
          employmentStatus: payload.employmentStatus,
          isDeleted: payload.isDeleted,
          tenantID: payload.tenantID ?? 0,
          password: payload.password // may be undefined (GOOD)
        }
      ).subscribe({
        next: (res: string) => {
          const normalizedMsg = (res ?? '')
            .toString()
            .trim()
            .replace(/^"|"$/g, '');

          this.msg = normalizedMsg;
           this.loadUsers();
          this.toast.show('Updated successfully.', 'success');
  
        },
        error: (err) => {
          this.msg = err?.error ?? 'Update failed';
          this.toast.show('Unable to update.', 'error');
        }
      });
    }
  }

  closeForm(): void {
    this.formOpen = false;
  }

  private loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.employees$ = this.auth.getEmployeesByTenant().pipe(
      map(users => {
        const list = Array.isArray(users) ? users : [];
        const mapped = list.map(user => this.toEmployee(user));
        if (this.employmentStatus === 1) {
          return mapped.filter(emp => emp.id === this.currentUserId);
        }
        return mapped;
      }),
      catchError(err => {
        this.error = err?.error ?? 'Unable to load employees';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
      })
    );

    this.filteredEmployees$ = combineLatest([this.employees$, this.searchTerm$]).pipe(
      map(([employees, term]) => this.filterEmployees(employees, term))
    );
  }

  private normalizeEmployee(employee: Employee): Employee {
    const tenantValue = employee.tenantId as number | null;
    const tenantId =
      tenantValue === null || tenantValue === undefined || tenantValue === 0
        ? null
        : Number(tenantValue);
    return {
      ...employee,
      employmentStatus: Number(employee.employmentStatus ?? 0),
      tenantId,
      isDeleted: Boolean(employee.isDeleted)
    };
  }

  private toPayload(employee: Employee) {
    const payload: {
      id: number;
      email: string;
      password?: string;
      name: string;
      companyName: string;
      employmentStatus: number;
      isDeleted: boolean;
      tenantID: number | null;
    } = {
      id: employee.id ?? 0,
      email: employee.email,
      password: employee.password ?? undefined,
      name: employee.name,
      companyName: employee.companyName,
      employmentStatus: employee.employmentStatus ?? 0,
      isDeleted: employee.isDeleted ?? false,
      tenantID: employee.tenantId ?? null
    };

    if (!payload.password) {
      delete payload.password;
    }

    return payload;
  }

  private toEmployee(user: UserApiResponse): Employee {
    const isDeleted = this.normalizeIsDeleted((user as unknown as { isDeleted?: unknown })?.isDeleted);
    const rawStatus = (user as unknown as { employmentStatus?: unknown; employementStatus?: unknown });
    const employmentStatus =
      (rawStatus.employmentStatus as number | undefined) ??
      (rawStatus.employementStatus as number | undefined) ??
      0;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      companyName: user.companyName,
      employmentStatus,
      isDeleted,
      tenantId: user.tenantID ?? null
    };
  }

  private normalizeIsDeleted(value: unknown): boolean {
    if (value === true || value === false) return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'number') return value === 1;
    return false;
  }

  updateSearch(term: string): void {
    this.searchTerm$.next(term ?? '');
  }

  private filterEmployees(employees: Employee[], term: string): Employee[] {
    const query = (term ?? '').toLowerCase().trim();
    if (!query) return employees;
    return employees.filter(employee => {
      const name = (employee.name ?? '').toLowerCase();
      const email = (employee.email ?? '').toLowerCase();
      const company = (employee.companyName ?? '').toLowerCase();
      return name.includes(query) || email.includes(query) || company.includes(query);
    });
  }
}
