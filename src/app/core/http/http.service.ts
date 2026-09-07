import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private urlBase = environment.apiUrl + '/api';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' } || { 'Content-Type': 'text' });
  private options = { headers: this.headers };

  constructor(private http: HttpClient) { }

  handleError(error: any) {
    const err = {
      message: '',
      code: error.status
    };

    if (error?.error?.message) {
      err.message = error.error.message;
    }

    else if (typeof error.error === 'string') {
      err.message = error.error;
    }

    else if (error?.error?.errors?.Password?.length > 0) {
      err.message = error.error.errors.Password[0];
    }

    else if (error.message) {
      err.message = error.message;
    }
    else {
      err.message = 'Something went wrong.';
    }
    return throwError(() => err);
  }

  public get(url: string, params = null) {
    const options = { headers: this.headers, params: null, };
    if (params) {
      options.params = params;
    }
    return this.http.get(`${this.urlBase}/${url}`, this.options).pipe(
      catchError(this.handleError)
    );
  }
  public getExternalApi(url: string, params = null) {
    const options = { headers: this.headers, params: null, };
    if (params) {
      options.params = params;
    }
    return this.http.get(url + this.getQueryString(params)).pipe(
      catchError(this.handleError)
    );
  }

  public getWithQueryParams(url: string, params: any = null) {
    const options = { headers: this.headers, params: null, };
    if (params) {
      options.params = params;
    }
    return this.http.get(`${this.urlBase}/${url}` + this.getQueryString(params)).pipe(
      catchError(this.handleError)
    );
  }

  public post<TRequest = any, TResponse = any>(url: string, body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(`${this.urlBase}/${url}`, body, this.options).pipe(
      catchError(this.handleError)
    );
  }

  public postWithQueryParams(url: string, body: any, params: any) {
    return this.http.post(`${this.urlBase}/${url}` + this.getQueryString(body), params, this.options).pipe(
      catchError(this.handleError)
    );
  }

  public postWithMultipart(url: string, body: any) {
    const headers = new HttpHeaders({ 'Content-Type': 'multipart/form-data' });
    const options = { headers: headers };
    return this.http.post(`${this.urlBase}/${url}`, body, options).pipe(
      catchError(this.handleError)
    );
  }

  public UploadFile(url: string, body: any) {
    const headers = new HttpHeaders({ 'Accept': 'application/json' });
    const options = { headers: headers };
    return this.http.post(`${this.urlBase}/${url}`, body, options).pipe(
      catchError(this.handleError)
    );
  }
  public ImportFile(url: string, params: any = null) {
    let query = params ? this.getQueryString(params) : '';
    url = `${this.urlBase}/${url}${query}`;
    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  public put(url: string, body: any) {
    return this.http.put(`${this.urlBase}/${url}`, body, this.options).pipe(
      catchError(this.handleError)
    );
  }

  public delete(url: string, params = null) {
    const options = { headers: this.headers, params: null, };
    if (params) {
      options.params = params;
    }
    return this.http.delete(`${this.urlBase}/${url}` + ((params != null) ? this.getQueryString(params) : '')).pipe(
      catchError(this.handleError)
    );
  }

  getQueryString = (obj: any) => {
    const qp = new URLSearchParams();

    Object.keys(obj).forEach(key => {
      const value = obj[key];

      if (Array.isArray(value)) {
        value.forEach(v => qp.append(key, v));
      } else if (value !== null && value !== undefined) {
        qp.append(key, value);
      }
    });

    const query = qp.toString();
    return query ? `?${query}` : '';
  };
}
