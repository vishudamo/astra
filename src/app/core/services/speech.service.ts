import { Injectable } from '@angular/core';

import { APIService } from './api.service';

import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {

    private audio = new Audio();

    private uid: number = 0;

    private isPlayingSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(private api: APIService) {
        
    }

    // public async Speak(message: string) {
    //     this.voice = new window.SpeechSynthesisUtterance();
    //     this.voice.lang = "en-US";
    //     this.voice.text = message;
        
    //     window.speechSynthesis.speak(this.voice);
    //     console.log("Before End", this.voice);

    //     return new Promise((resolve) => {
    //         this.voice.onend = function() {
    //             console.log("On End", this.voice);
    //             resolve();
    //         }
    //     });
    // }

    public async PollySpeak(msg: string): Promise<void> {
        this.isPlayingSubject.next(true);
        this.uid++;
        const status = await this.api.SetAstraAudio(msg, this.uid);
        if(status) {
            let url = `https://astra-node.herokuapp.com/${this.uid}.mp3`;
            // let url = `http://localhost:8080/${this.uid}.mp3`;
            this.audio.src = url;
            this.audio.load();
            this.audio.play();

            this.audio.addEventListener("ended", () => {
                this.isPlayingSubject.next(false);
            });
        }
    }

    // public async PollySpeakMultiple(msgList: Array<string>): Promise<void> {
    //     this.isPlayingSubject.next(true);
    //     let next = false;
    //     msgList.forEach(async (msg, i) => {
    //         if(next) return;
    //         this.uid++;
    //         const status = await this.api.SetAstraAudio(msg, this.uid);

    //         if(status) {
    //             let url = `http://localhost:3000/audio/${this.uid}.mp3`;
    //             this.audio.src = url;
    //             this.audio.load();
    //             this.audio.play();

    //             if(i !== (msgList.length - 1)) {
    //                 this.audio.onended = () => {

    //                 }
    //             }

    //             this.audio.addEventListener("ended", () => {
    //                 this.isPlayingSubject.next(false);
    //                 return new Promise(resolve => resolve);
    //             });
    //         }
    //     });
    // }

    get IsSpeaking(): Observable<boolean> {
        return this.isPlayingSubject;
    }

    get IsSpeakingSync(): boolean {
        return this.isPlayingSubject.getValue();
    }
}
