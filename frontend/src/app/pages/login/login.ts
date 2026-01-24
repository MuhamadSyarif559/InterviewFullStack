import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
@Component({
  standalone: true,
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  msg = '';
  form: FormGroup;

  constructor(private fb: FormBuilder, private auth: Auth) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

 

  submit() {
    this.msg = '';
    const { email, password } = this.form.value;
    if (!email || !password) return;

    this.auth.login(email, password).subscribe({
      next: (res) => this.msg = res,
      error: (err) => this.msg = err?.error ?? 'Login failed'
    });
  }
}
