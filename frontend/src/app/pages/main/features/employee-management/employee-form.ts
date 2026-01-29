import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee } from './employee.model';
import { SessionService } from '../../../../services/session';

@Component({
  standalone: true,
  selector: 'app-employee-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.scss'
})
export class EmployeeForm implements OnChanges {
  @Input() employee: Employee | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Output() save = new EventEmitter<Employee>();
  @Output() cancel = new EventEmitter<void>();

   form: FormGroup;

  constructor(private fb: FormBuilder,private session: SessionService) {
    this.form = this.fb.group({
      id: [{ value: null, disabled: true }],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      companyName: ['', Validators.required],
      employmentStatus: [0, Validators.required],
      tenantId: [null],
      isDeleted: [false],
      password: ['']
    });
  }

  ngOnChanges(): void {
    if (this.employee) {
      this.form.reset({
        id: this.employee.id,
        name: this.employee.name,
        email: this.employee.email,
        companyName: this.employee.companyName,
        employmentStatus: this.employee.employmentStatus ?? 0,
        tenantId: this.employee.tenantId ?? null,
        isDeleted: this.employee.isDeleted ?? false,
        password: ''
      });
    } else {
      const data = this.session.value;
      this.form.reset({
        name: '',
        email: '',
        companyName: data?.companyName ?? '',
        employmentStatus: 0,
        tenantId:  data?.tenantID ?? 0,
        isDeleted: false,
        password: ''
      });
    }

    this.setPasswordValidators();
  }

submit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  const value = this.form.getRawValue() as Employee;
  if (this.mode === 'edit' && (!value.password || value.password.trim() === '')) {
    delete (value as any).password;
  }

  this.save.emit(value);
}

  private setPasswordValidators(): void {
    const passwordControl = this.form.get('password');
    if (!passwordControl) {
      return;
    }

    if (this.mode === 'add') {
      passwordControl.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      passwordControl.clearValidators();
    }

    passwordControl.updateValueAndValidity({ emitEvent: false });
  }
}



