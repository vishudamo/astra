import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';

import { Subject, combineLatest } from 'rxjs';
import { takeUntil, withLatestFrom, filter } from 'rxjs/operators';

import { Store, select } from '@ngrx/store';

import { AuthModuleState, AuthAction } from './store';

import { AWSService, SpeechService, AstraCommandService } from '../core/services';

import { FormEventState } from '../models/enums';
import { FormState, PageState } from '../models';


export interface LoginViewState {
    form: {
        username: FormEventState;
        password: FormEventState;
    }
}

@Component({
    selector: 'app-login',
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
    public form: FormGroup;

    private formEl: {
        username: ElementRef,
        password: ElementRef
    };
    
    @ViewChild('user', {static: true}) private user: ElementRef;
    @ViewChild('pass', {static: true}) private pass: ElementRef;

    private isAwaitingInput: boolean = false;
    private oldTranscription: string = "";
    private currentOrder: number;

    private destroySub: Subject<void> = new Subject();

    constructor(
        private store: Store<AuthModuleState>,
        private router: Router,
        private ngZone: NgZone,
        private aws$: AWSService,
        private speech$: SpeechService,
        private astra$: AstraCommandService
    ) {}

    ngAfterViewInit() {
        this.formEl = {
            username: this.user,
            password: this.pass
        };
    }

    ngOnInit() {
        this.form = new FormGroup({
            username: new FormControl( '', [ Validators.required ] ),
            password: new FormControl( '', [ Validators.required, Validators.minLength(3) ])
        });

        combineLatest(
            this.aws$.IsRecording,
            this.aws$.Transcription
        ).pipe(
            filter(([isRec, trans]) => (isRec && !!trans)),
            withLatestFrom(
                this.store.pipe(select(state => state.authState.pageState))
            ),
            takeUntil(this.destroySub)
        ).subscribe(([[isRec, trans], pageState]) => {

            if(this.oldTranscription === trans) return;

            if(this.astra$.Wakeup.includes(trans)) {
                this.initialEvent(pageState);
            } else {
                if(this.isAwaitingInput) {
                    const el = pageState.formState.find(row => row.order === this.currentOrder);
                    this.form.controls[el.name].setValue(trans);
                    this.isAwaitingInput = false;
                    this.nextEvent(pageState);
                }
            }

            this.oldTranscription = trans;
        });
    }

    private async initialEvent(pageState: PageState) {
        this.currentOrder = 1;
        const el = pageState.formState.find(row => row.order === 1);
        this.form.controls[el.name].setValue('');
        this.formEl.username.nativeElement.focus();
        const newState: FormState = {
            ...el,
            currentEventState: FormEventState.Touched
        };
        this.store.dispatch(new AuthAction.UpdatePageState(newState));
        await this.speech$.PollySpeak(el[el.currentEventState]);
        this.isAwaitingInput = true;
    }

    private async nextEvent(pageState: PageState) {
        if(this.currentOrder !== pageState.formState.length) {
            this.currentOrder++;
            const el = pageState.formState.find(row => row.order === this.currentOrder);
            this.form.controls[el.name].setValue('');
            this.formEl[el.name].nativeElement.focus();
            const newState: FormState = {
                ...el,
                currentEventState: FormEventState.Touched
            };
            this.store.dispatch(new AuthAction.UpdatePageState(newState));
            await this.speech$.PollySpeak(el[el.currentEventState]);
            this.isAwaitingInput = true;
            return;
        }
        this.voiceLogin(pageState);
    }

    ngOnDestroy() {
        this.destroySub.next();
        this.destroySub.complete();
    }

    public async voiceLogin(pageState: PageState) {
        if(this.form.valid) {
            if(this.form.controls["username"].value === "smith" &&
            this.form.controls["password"].value === "leopard") {
                const smsg = `welcome doctor ${this.form.controls["username"].value}`;
                await this.speech$.PollySpeak(smsg);
                this.ngZone.run(() => this.router.navigate(["console"]));
            } else {
                const smsg = "sorry. i cannot recognise you. please check your username and passcode";
                await this.speech$.PollySpeak(smsg);
                this.initialEvent(pageState);
            }
        }
    }

    public login(): void {
        if(this.form.valid) {
            if(this.form.controls["username"].value === "John Mathew" &&
            this.form.controls["password"].value === "123") {
                this.ngZone.run(() => this.router.navigate(["console"]));
            }
        }
    }
}