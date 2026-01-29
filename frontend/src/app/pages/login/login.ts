import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { SessionData, SessionService } from '../../services/session';
import { finalize, switchMap } from 'rxjs';
@Component({
  standalone: true,
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  msg = '';
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private toast: ToastService,
    private session: SessionService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  get isError() {
    return this.msg && this.msg.toLowerCase().includes('failed');
  }

  submit() {
    this.msg = '';
    if (this.loading) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.value;
    if (!email || !password) return;

    this.loading = true;
    this.auth
      .login(email, password)
      .pipe(
        switchMap(() => this.auth.me()),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
      next: (data: SessionData) => {
        this.session.set({
          userId: data?.userId ?? 0,
          email: data?.email ?? '',
          name: data?.name ?? '',
          companyName: data?.companyName ?? '',
          tenantID: data?.tenantID ?? 0
        });
        this.toast.show('Successfully logged in.', 'success');
        this.router.navigateByUrl('/main');
      },
      error: (err) => {
        this.msg = err?.error ?? 'Login failed';
        this.toast.show('Login failed.', 'error');
      }
    });
  }
}
