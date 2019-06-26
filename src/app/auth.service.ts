import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';

import { User } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  private apiUrl = environment.apiUrl;

  login(email: string, password: string) {
    const authData = {email, password};
    this.http.post<{ token: string, expiresIn: string, user: User }>(this.apiUrl + '/api/users/login', authData)
      .subscribe((response) => {
        console.log(response);
      });
  }

}
