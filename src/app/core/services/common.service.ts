import { Injectable } from "@angular/core";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import { ResultResponseDto } from "../models/ResultResponseDto";
import { UserService } from "./user.service";
import { BehaviorSubject, catchError, from, map, Observable, switchMap, tap } from "rxjs";
import { HttpService } from "../http/http.service";
import { UpdateUserResponseDto, UserInfo } from "../models/UserInfo";
import { CityVM } from "../models/CityVM";
import { GetNearestCityRequestDto } from "../models/GetNearestCityRequestDto";
import { ToasterService } from "./toaster.service";

@Injectable({
  providedIn: "root",
})
export class CommonService {
  latitude = 0;
  longitude = 0;

  private years = new BehaviorSubject<number[]>(this.getYearList(2025));

  constructor(private http: HttpService, private userService: UserService, private toaster: ToasterService) { }

  public getAllCityByLocation(): Observable<ResultResponseDto<CityVM[]>> {
    const payload: GetNearestCityRequestDto = {
      userID: this.userService.userInfo.userID,
      latitude: this.latitude,
      longitude: this.longitude,
    };

    return this.http
      .getWithQueryParams('City/getAllCityByLocation', payload)
      .pipe(map((x) => x as ResultResponseDto<CityVM[]>));
  }

  public getUserNearestCity(): Observable<ResultResponseDto<CityVM[]>> {
    if (navigator.geolocation) {
      return from(
        new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        })
      ).pipe(
        switchMap((position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          return this.getAllCityByLocation();
        }),
        catchError((error) => {
          console.error('Geolocation error:', error);
          this.toaster.showError(
            'Location access denied or unavailable. Showing all cities.'
          );
          return this.getAllCityByLocation(); // fallback
        })
      );
    } else {
      this.toaster.showError('Geolocation not supported by this browser.');
      return this.getAllCityByLocation();
    }
  }

  public getUserInfo() {
    return this.http
      .get(`User/getUserInfo`)
      .pipe(map((x) => x as ResultResponseDto<UserInfo>));
  }

  public updateUser(formData: FormData) {
    return this.http
      .UploadFile(`Auth/updateUser`, formData)
      .pipe(map((x) => x as ResultResponseDto<UpdateUserResponseDto>));
  }
  public refreshToken() {
    this.userService.isTokenRefresh = new Date(Date.now() + 35 * 60 * 1000);
    let userRes = this.userService?.userInfo;
    if (userRes == null) {
      this.userService.RedirectBasedOnRole();
    }
    return this.http.post(`Auth/refreshToken`, { userID: userRes?.userID })
      .pipe(
        map(x => x as ResultResponseDto<UserInfo | any>),
        tap((user) => {
          if (user) {
            var rememberMe = userRes?.rememberMe;
            user.result.rememberMe = rememberMe;
            this.userService.userInfo = user.result;
          }
        }));
  }
  get applicateYears() {
    return this.years.value;
  }
  getStartOfYearLocal(year: number): string {
    return `${year}-01-01T00:00:00`;
  }
  exportExcel(data: any[]): void {
    // Convert JSON to worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Set column width dynamically (based on longest value)
    const objectMaxLength: number[] = [];
    data.forEach((record) => {
      Object.keys(record).forEach((key, i) => {
        const columnLength = record[key] ? record[key].toString().length : 10;
        objectMaxLength[i] = Math.max(objectMaxLength[i] || 10, columnLength);
      });
    });

    worksheet["!cols"] = objectMaxLength.map((w) => ({ wch: w + 5 }));

    // Create workbook and add worksheet
    const workbook: XLSX.WorkBook = {
      Sheets: { "Pillars Data": worksheet },
      SheetNames: ["Pillars Data"],
    };

    // Generate Excel buffer
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Save file
    const fileName = `Pillars_Data_${new Date().getTime()}.xlsx`;
    FileSaver.saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      fileName
    );
  }

  GetPadding(n: number) {
    let paddingInner = 0.2;
    let paddingOuter = 0.1;

    if (n === 1) {
      // Special case: one pillar → center the bar
      paddingInner = 0.8;
      paddingOuter = 0.41;
    } else if (n < 15) {
      // Smoothly reduce padding from ~0.8 (for 2) down to ~0.25 (for 14)
      paddingInner = Math.max(0.25, 1 - n * 0.1); // e.g. 2→0.88, 10→0.4, 14→0.25
      paddingOuter = Math.max(0.1, 0.6 - n * 0.06); // e.g. 2→0.54, 10→0.3, 14→0.18
    } else if (n < 50) {
      paddingInner = 0.25;
      paddingOuter = 0.15;
    } else {
      paddingInner = 0.05;
      paddingOuter = 0.05;
    }
    return { paddingInner, paddingOuter };
  }
  getYearList(startYear: number): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];

    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }
  public getLatitudeLongitude(city: any) {
    return this.http
      .getExternalApi('https://nominatim.openstreetmap.org/search', city)
      .pipe(map((x) => x as any[]));
  }
  getGeneratedTime(utcDate: string | Date | null | undefined): string {
    if (!utcDate) return 'NA';

    // 🔑 Ensure UTC parsing
    const utc =
      typeof utcDate === 'string' && !utcDate.endsWith('Z') ? utcDate + 'Z' : utcDate;

    const generatedDate = new Date(utc);
    const now = new Date();

    const diffMs = now.getTime() - generatedDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Less than 1 minute
    if (diffMinutes < 10) {
      return 'Just now';
    }

    // Less than 1 hour
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    }

    // Less than 24 hours
    if (diffHours < 24) {
      const remainingMinutes = diffMinutes % 60;
      return remainingMinutes > 0
        ? `${diffHours} hr ${remainingMinutes} min`
        : `${diffHours} hr`;
    }

    // 24 hours or more → show days + hours
    const remainingHours = diffHours % 24;
    return remainingHours > 0
      ? `${diffDays} day ${remainingHours} hr`
      : `${diffDays} day`;
  }
    researchStatusClass(date: Date | string | null | undefined): string {
  if (!date) return 'old';

  const parsedDate = new Date(date);

  // Invalid JS date
  if (isNaN(parsedDate.getTime())) return 'old';

  // Ignore .NET MinValue (0001-01-01)
  if (parsedDate.getFullYear() <= 1) return 'old';

  const diffHours =
    (Date.now() - parsedDate.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) return 'just-now';
  if (diffHours <= 72) return 'fresh';
  if (diffHours <= 240) return 'recent';

  return 'old';
}
isValidDate(date: any): boolean {
  if (!date) return false;

  const parsed = new Date(date);

  if (isNaN(parsed.getTime())) return false;

  // Block .NET MinValue
  if (parsed.getFullYear() <= 1) return false;

  return true;
}
  get PillarColors() {
    return [
      "#a2c3ba",
      "#8eb5ab",
      "#79a89b",
      "#649b8c",
      "#578679",
      "#4a7167",
      "#3c5d54",
      "#2f4841",
      "#21342f",
      "#141f1c",
    ];
  }
  get radarColors() {
    return [
      {
        primary: '#1b2b27',
        light: '#4b615b',
        gradient: 'rgba(20, 31, 28, 0.25)'
      },

      {
        primary: '#04775a',
        light: '#7fa39a',
        gradient: 'rgba(74, 113, 103, 0.25)'
      },
      {
        primary: '#649b8c',
        light: '#94beb4',
        gradient: 'rgba(100, 155, 140, 0.25)'
      },
      {
        primary: '#2f4841',
        light: '#637f78',
        gradient: 'rgba(47, 72, 65, 0.25)'
      },
      {
        primary: '#a2c3ba',
        light: '#c7ddd7',
        gradient: 'rgba(162, 195, 186, 0.25)'
      },
      {
        primary: '#8eb5ab',
        light: '#b6d1ca',
        gradient: 'rgba(142, 181, 171, 0.25)'
      },
      {
        primary: '#79a89b',
        light: '#a6c8bf',
        gradient: 'rgba(121, 168, 155, 0.25)'
      },

      {
        primary: '#578679',
        light: '#89b0a6',
        gradient: 'rgba(87, 134, 121, 0.25)'
      },

      {
        primary: '#3c5d54',
        light: '#6f9188',
        gradient: 'rgba(60, 93, 84, 0.25)'
      },

      {
        primary: '#141f1c',
        light: '#4b615b',
        gradient: 'rgba(20, 31, 28, 0.25)'
      }
    ];
  }


  get kpiColors() {
    return [
      '#6685a7', // blue
      '#dc3545', // red
      '#28a745', // green
      '#f1d47d', // yellow
      '#17a2b8', // cyan
      '#725e97', // purple
      '#b99e88', // orange
      '#2a7760', // teal
      '#7e767a', // pink
      '#343a40'  // dark gray
    ];
  }

}
