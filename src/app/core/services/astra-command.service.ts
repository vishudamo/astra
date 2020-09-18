import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class AstraCommandService {
    private readonly wakupCommand: Array<string> = [
        "hello",
        "hello, astra",
        "hi",
        "hi, astra"
    ];

    private readonly shutdownCommand: Array<string> = [
        "goodbye",
        "goodbye, astra"
    ];

    get Wakeup(): Array<string> {
        return this.wakupCommand;
    }

    get ShutDown(): Array<string> {
        return this.shutdownCommand;
    }
}