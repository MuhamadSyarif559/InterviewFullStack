import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main implements OnInit {
  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.auth.me().subscribe({
      next: () => {},
      error: () => this.router.navigateByUrl('/login')
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
