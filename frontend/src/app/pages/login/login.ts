import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { ToastService } from '../../services/toast';
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

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private toast: ToastService
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
    const { email, password } = this.form.value;
    if (!email || !password) return;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.toast.show('Successfully logged in.', 'success');
        setTimeout(() => this.router.navigateByUrl('/main'), 900);
      },
      error: (err) => {
        this.msg = err?.error ?? 'Login failed';
        this.toast.show('Login failed.', 'error');
      }
    });
  }
}
