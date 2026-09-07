import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { CityVM } from 'src/app/core/models/CityVM';
import { UserService } from 'src/app/core/services/user.service';

@Injectable({
  providedIn: 'root'
})

export class UserDataShareService {

  public city = signal<CityVM | null>(null);

  public compareCity = signal<CityVM[] | null>(null);

  userService = inject(UserService);

  public userCityMappingIDSubject$ = new BehaviorSubject<number | null>(null);



}
