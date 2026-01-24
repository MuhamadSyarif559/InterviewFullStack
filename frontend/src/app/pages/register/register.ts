import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
@Component({
  standalone: true,
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})


export class Register {


  msg = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: Auth
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    this.msg = '';

    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.value;

    this.auth.register(email!, password!).subscribe({
      next: (res) => this.msg = res,
      error: (err) => this.msg = err?.error ?? 'Register failed'
    });
  }
}
