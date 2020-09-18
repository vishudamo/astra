import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as createHash from 'create-hash';
import * as marshaller from '@aws-sdk/eventstream-marshaller';
import * as util_utf8_node from '@aws-sdk/util-utf8-node';
import MicrophoneStream from 'microphone-stream';

import { pcmEncode, downsampleBuffer } from '../helpers/audioUtils';
import { createPresignedURL } from '../helpers/aws-signature-v4';
import { SpeechService } from './speech.service';

//global buffer
declare const Buffer;

// our converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);

@Injectable({
    providedIn: 'root'
})
export class AWSService {

    //AWS Transcription Settings
    private languageCode: string = "en-US";
    private region: string = "us-east-2";
    private accessKey: string = "null";
    private accessSecret: string = "null";

    //Others
    private socket: WebSocket;
    private micStream: any;

    private sampleRate: number = 44100;

    private socketError: boolean = false;
    private transcribeException: boolean = false;

    private isSocketOpened: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private transcriptionSubject: BehaviorSubject<string> = new BehaviorSubject("");

    constructor(private speech$: SpeechService) {}

    public StreamAudioToWebSocket(userMediaStream: MediaStream) {
        //Init Mic Stream for microphone audio
        this.micStream = new MicrophoneStream();
        this.micStream.setStream(userMediaStream);

        let url = this.createNewPresignedURL();

        this.socket = new WebSocket(url);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
            console.log("Socket Opened");
            this.isSocketOpened.next(true);
            this.micStream.on('data', (rawAudioChunk) => {
                if(!this.speech$.IsSpeakingSync) {
                    let binary = this.convertAudioToBinaryMessage(rawAudioChunk);
                    if (this.socket.OPEN) this.socket.send(binary);
                }
            });
        };

        this.socket.onmessage = (message: MessageEvent) => {
            let messageWrapper = eventStreamMarshaller.unmarshall(Buffer(message.data));
            let messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));
            // console.log(messageWrapper.headers);
            if (messageWrapper.headers[':message-type'].value === 'event') {
                this.handleEventStreamMessage(messageBody);
            } else {
                this.transcribeException = true;
            }
        };

        this.socket.onerror = () => {
            this.socketError = true;
        };

        this.socket.onclose = (closeEvent: CloseEvent) => {
            this.micStream.stop();
            // the close event immediately follows the error event; only handle one.
            if (!this.socketError && !this.transcribeException) {
                if (closeEvent.code != 1000) {
                    console.log('error' + closeEvent.reason);
                }
            }
        };
    }

    private handleEventStreamMessage(messageJson) {
        let results = messageJson.Transcript.Results;

        if (results.length > 0) {
            if (results[0].Alternatives.length > 0) {
                let transcript = results[0].Alternatives[0].Transcript;

                // fix encoding for accented characters
                transcript = decodeURIComponent(escape(transcript));

                // if transcript segment is final
                if (!results[0].IsPartial) {
                    const finalTrans = this.sanitizeString(transcript);
                    console.log("transcript", finalTrans);
                    this.transcriptionSubject.next(finalTrans);
                }
            }
        }
    }

    private convertAudioToBinaryMessage(audioChunk): Uint8Array {
        let raw = MicrophoneStream.toRaw(audioChunk);
        if (raw == null) return;

        let downsampledBuffer = downsampleBuffer(raw, this.sampleRate);
        let pcmEncodedBuffer = pcmEncode(downsampledBuffer);

        // add the right JSON headers and structure to the message
        let audioEventMessage = this.getAudioEventMessage(Buffer.from(pcmEncodedBuffer));

        //convert the JSON object + headers into a binary event stream message
        // @ts-ignore
        let binary = eventStreamMarshaller.marshall(audioEventMessage);

        return binary;
    }

    private getAudioEventMessage(buffer) {
        // wrap the audio data in a JSON envelope
        return {
            'headers': {
            ':message-type': {
                type: 'string',
                value: 'event'
            },
            ':event-type': {
                type: 'string',
                value: 'AudioEvent'
            }
            },
            body: buffer
        };
    }

    private createNewPresignedURL(): string {
        let endpoint = 'transcribestreaming.' + this.region + '.amazonaws.com:8443';
        return createPresignedURL(
            'GET',
            endpoint,
            '/stream-transcription-websocket',
            'transcribe',
            createHash('sha256').update('', 'utf8').digest('hex'),
            {
              key: this.accessKey,
              secret: this.accessSecret,
              protocol: 'wss',
              expires: 6,
              region: this.region,
              query:
                'language-code=' +
                this.languageCode +
                '&media-encoding=pcm&sample-rate=' +
                this.sampleRate
            }
        );
    }

    public CloseSocket() {
        if(this.socket.OPEN) {
            this.micStream.stop();

            // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
            let emptyMessage = this.getAudioEventMessage(Buffer.from(new Buffer([])));
            // @ts-ignore
            let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
            this.socket.send(emptyBuffer);
            this.isSocketOpened.next(false);
        }

        if(this.socket.CLOSED) {
            return true;
        }
        return false;
    }

    get IsRecording(): Observable<boolean> {
        return this.isSocketOpened;
    }

    get IsRecordingSync(): boolean {
        return this.isSocketOpened.getValue();
    }

    get Transcription(): Observable<string> {
        return this.transcriptionSubject;
    }

    private sanitizeString(data: string): string {
        if(!data.length) return data;
        let sData = data.trim();

        if(sData[sData.length - 1] === ".") {
            sData = sData.slice(0, -1);
        }

        if(sData[sData.length - 1] === "?") {
            sData = sData.slice(0, -1);
        }

        return sData.toLowerCase();
    } 
}