import { Component, OnInit } from '@angular/core';

import { AWSService } from '../services/aws.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-mic',
  templateUrl: './mic.component.html',
  styleUrls: ['./mic.component.css']
})
export class MicComponent implements OnInit {

    public isMicOn: Observable<boolean>;

    constructor(
        private aws$: AWSService
    ) { }

    ngOnInit(): void {
        this.isMicOn = this.aws$.IsRecording;
    }

    private async startAstra(): Promise<void> {
        let userMediaStream: MediaStream;
        try {
            userMediaStream = await window.navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true
            });
            this.aws$.StreamAudioToWebSocket(userMediaStream);
        } catch(e) {
            console.log("Error in getting user media", e);
        }
    }

    private stopAstra() {
        this.aws$.CloseSocket();
    }

    public async ToggleAstra() {
        if(this.aws$.IsRecordingSync) {
            this.stopAstra();
            return;
        } 
        this.startAstra();
    }
}
