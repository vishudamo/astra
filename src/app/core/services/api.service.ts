import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Procedure } from 'src/app/models';

@Injectable({
    providedIn: 'root'
})
export class APIService {

    private domain = "https://astra-node.herokuapp.com/api/";
    // private domain = "http://localhost:8080/api/"

    constructor(private http: HttpClient) {}

    public SetAstraAudio(msg: string, uid: any) {
        let endpoint = `${this.domain}convert-audio?msg=${msg}&uid=${uid}`;
        return this.http.get(endpoint).toPromise();
    }

    public GetAudio(url: string) {
        return this.http.get(url).toPromise();
    }

    public PostProcDetail(data): Promise<any> {
        let endpoint = `${this.domain}document/`;
        console.log("Called for generating PDF", endpoint);
        return this.http.post(endpoint, data).toPromise();
    }

    public GetProcReportNames(): Observable<string[]> {
        let endpoint = `${this.domain}docs/list/`;
        return this.http.get<string[]>(endpoint);
    }

    public UpdateCSV(data: Procedure): Observable<string> {
        let endpoint = `${this.domain}csv`;
        return this.http.post<string>(endpoint, data);
    }
}