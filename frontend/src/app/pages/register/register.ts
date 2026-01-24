import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { ToastService } from '../../services/toast';
@Component({
  standalone: true,
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})


export class Register {


  msg = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmpassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get isError() {
    const msg = this.msg ? this.msg.toLowerCase() : '';
    return msg.includes('failed') || msg.includes('password');
  }

  submit() {
    this.msg = '';
    this.form.get('confirmpassword')?.setErrors(null);

    if (this.form.invalid) {
      return;
    }
    if (this.form.get('password')?.value === this.form.get('confirmpassword')?.value) {
      const { email, password } = this.form.value;

      this.auth.register(email!, password!).subscribe({
        next: (res) => {
          const normalized = (res ?? '').toString().trim().replace(/^"|"$/g, '');
          this.msg = normalized;

          if (normalized.toLowerCase() === 'registered') {
            this.toast.show('Registered successfully.', 'success');
            setTimeout(() => this.router.navigateByUrl('/login'), 900);
          }
        },
        error: (err) => {
          this.msg = err?.error ?? 'Register failed';
          this.toast.show('Register failed.', 'error');
        }
      });
    } else {
      this.form.get('confirmpassword')?.setErrors({ mismatch: true });
      this.msg = 'Password and confirm password must be same';
      this.toast.show('Password and confirm password must be same', 'error');
    }
  }
}
