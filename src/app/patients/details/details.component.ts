import { Component, OnInit, OnDestroy, ViewChild, NgZone, ElementRef, AfterViewInit } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Subject, combineLatest, of as observableOf } from 'rxjs';
import { takeUntil, withLatestFrom, take, filter } from 'rxjs/operators';
import { Actor, DetailPageContext, ScreeningType, SurgeryStatus } from 'src/app/models/enums';
import { VLog, Procedure } from 'src/app/models';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { Store, select } from '@ngrx/store';
import { PatientsModuleState, PatientsAction } from '../store';
import { AWSService, SpeechService, AstraCommandService } from 'src/app/core/services';
import { Router } from '@angular/router';
import { APIService } from 'src/app/core/services/api.service';

@Component({
  selector: 'app-details',
  templateUrl: 'details.component.html',
  styleUrls: ['details.component.css']
})
export class DetailsComponent implements OnInit, OnDestroy, AfterViewInit {
    private currentTab: number = 0;

    //Astra
    private isAwaitingInput: boolean;
    private appContext: DetailPageContext; 
    private currentOrder: number = 1;

    private readonly anusAltWordList = [
        "tennis",
        "janice",
        "vanish",
        "dennis",
        "anise",
        "alice",
        "eunice",
        "ennis",
        "venice",
        "anus"
    ];

    private readonly doctorNoteStopWordList = [
        "master",
        "castro",
        "faster",
        "astra"
    ];

    //Procedure
    public procedureDetails: Procedure = {
        surgeryType: "Colonoscopy",
        screeningType: null,
        preExistCondition: {
            init: false,
            value: false
        },
        screenForNeoplasm: {
            init: false,
            value: false
        },
        procPerformedWay: null,
        procedureNotes: [],
        surgeryStatus: SurgeryStatus.Pending,
        icdCode: [],
        cptCode: []
    };

    //Form Values
    public screeningType: string;
    public preCondition: string;
    public malneoplasm: string;
    public procPerfWay: string;
    public procNote: string;


    @ViewChild("patientInfo", { static: true }) private patientInfo: MatTabGroup;
    @ViewChild("icdInp", {static: true}) private icdInfo: ElementRef;
    @ViewChild("cpt", {static: true}) private cpt: ElementRef;

    private destroySubs: Subject<void> = new Subject();

    public docFiles: Array<{
        fileName: string,
        url: string
    }>;
    public isDoc: boolean;

    constructor(
        private ngZone: NgZone,
        private dialog: MatDialog,
        private store: Store<PatientsModuleState>,
        private aws$: AWSService,
        private speech$: SpeechService,
        private astra$: AstraCommandService,
        private router: Router,
        private api$: APIService
    ) { }

    ngAfterViewInit() {
        this.aws$.IsRecording.pipe(
        take(1)
        ).subscribe(async value => {
            if(value) {
                if(this.currentTab === 0) {
                    this.isAwaitingInput = false;
                    const verMsg = "Patient case verified";
                    // await this.speech$.PollySpeak(verMsg);
                    // const diagMsg = "Will you be doing a standard or diagnostic colonoscopy screening today";
                    const diagMsg = verMsg + "Doctor. Do you want to proceed to observation or procedure";
                    await this.speech$.PollySpeak(diagMsg);
                    this.appContext = DetailPageContext.ObsOrProc;
                    // this.appContext = DetailPageContext.ScreeningType;
                    this.isAwaitingInput = true;
                }
            }
        });
    }

    ngOnInit(): void {

        this.api$.GetProcReportNames().subscribe(docs => {
            console.log("Actual Doc received", docs);
            if(!docs) {
                this.docFiles = [];
                this.isDoc = false;
            } else {
                this.docFiles = docs.length ? docs.map(row => {
                    return {
                        fileName: row,
                        // url: `http://localhost:8080/docs/${row}`
                        url: `https://astra-node.herokuapp.com/docs/${row}`
                    };
                }) : [];
                this.isDoc = docs.length ? true : false;
            }
        });

        combineLatest(
            this.aws$.IsRecording,
            this.aws$.Transcription
        ).pipe(
            filter(([isRec, trans]) => (isRec && !!trans)),
            withLatestFrom(this.store.pipe(select(state => state.patientsState.pageState))),
            takeUntil(this.destroySubs)
        ).subscribe(([[isRec, trans], pageState]) => {
            if(this.astra$.ShutDown.includes(trans)) {
                this.logout();
            } else {
                if(this.isAwaitingInput) {
                    this.isAwaitingInput = false;
                    switch(this.appContext) {
                        case DetailPageContext.ObsOrProc:
                            this.handleObsOrProc(trans);
                            return;
                        case DetailPageContext.StartProcFromObs:
                            this.handleStartProcFromObs(trans);
                            return;
                        case DetailPageContext.ScreeningType:
                            this.handleScreeningType(trans);
                            return;
                        case DetailPageContext.AnyModifiers:
                            this.handlerModifierEvent(trans);
                            return;
                        case DetailPageContext.PreExistingCondition:
                            this.handlePreCondition(trans);
                            return;
                        case DetailPageContext.MalignantNeoplasm:
                            this.handleNeoplasm(trans);
                            return;
                        case DetailPageContext.ProcedurePerformedWay:
                            this.handleProcPerformed(trans);
                            return;
                        case DetailPageContext.DoctorState:
                            this.handleDoctorState(trans);
                            return;
                        case DetailPageContext.MissModifier:
                            this.handleMissMod(trans);
                            return;
                        case DetailPageContext.ScreeningComplete:
                            this.handleScreenComplete(trans);
                            return;
                        case DetailPageContext.UpdateRecord:
                            this.handleUpdateRecord(trans);
                            return;
                        case DetailPageContext.UpdateBilling:
                            this.handleUpdateBilling(trans);
                            return;
                        case DetailPageContext.Summary:
                            this.handleSummary(trans);
                            return;
                    }
                }
            }
        });
    }

    private async handleObsOrProc(transcript: string) {
        if(transcript === "procedure") {
            this.ngZone.run(() => this.patientInfo.selectedIndex = 2);
            this.startProcedure();
        } else if(transcript === "observation") {
            this.ngZone.run(() => this.patientInfo.selectedIndex = 1);
            this.startObservation();
        } else {
            const msg = `Sorry Doctor. ${transcript} is not a valid answer. Please say procedure or observation`;
            await this.speech$.PollySpeak(msg);
            this.isAwaitingInput = true;
        }
    }

    private async startObservation() {
        const msg = "Here are the details for the Observation";
        // await this.speech$.PollySpeak(msg);
        const diagMsg = msg + "Do you want to start the procedure for colonoscopy?"
        await this.speech$.PollySpeak(diagMsg);
        this.appContext = DetailPageContext.StartProcFromObs;
        this.isAwaitingInput = true;
    }

    private async handleStartProcFromObs(transcript: string) {
        if(transcript === "yes") {
            this.ngZone.run(() => this.patientInfo.selectedIndex = 2);
            this.startProcedure();
        } else if(transcript === "no") {
            const msg = "Sorry Doctor Procedure has to be started. Please say Yes to proceed";
            await this.speech$.PollySpeak(msg);
            this.isAwaitingInput = true;
        } else {
            const msg = `Sorry Doctor. ${transcript} is not a valid answer. Please say yes or no`;
            await this.speech$.PollySpeak(msg);
            this.isAwaitingInput = true;
        }
    }

    private async startProcedure() {
        const diagMsg = "OK Doctor. Procedure has been started";
        await this.speech$.PollySpeak(diagMsg);
        this.screeningTypeEvent();
    }

    private async screeningTypeEvent() {
        const msg = "Will you be doing a standard or diagnostic colonoscopy screening today";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.ScreeningType;
        this.isAwaitingInput = true;
    }

    private async handleScreeningType(transcript: string) {
        if(transcript === "standard") {
            this.procedureDetails.screeningType = ScreeningType.Standard;
            this.ngZone.run(() => this.screeningType = "1");
            this.modifierEvent();
            return;
        } else if(transcript === "diagnostic") {
            this.procedureDetails.screeningType = ScreeningType.Diagnostics;
            this.ngZone.run(() => this.screeningType = "2");
            this.modifierEvent();
            return;
        } else {
            const errMsg = `Sorry doctor. Cannot recognize ${transcript}. Valid answers are Standard or Diagnostic`;
            // await this.speech$.PollySpeak(errMsg);
            const rpMsg = errMsg + "Will you be doing a standard or diagnostic colonoscopy screening today";
            await this.speech$.PollySpeak(rpMsg);
            this.isAwaitingInput = true;
        }
    }

    private async modifierEvent() {
        const modMsg = "should I be prepared for any modifiers?";
        await this.speech$.PollySpeak(modMsg);
        this.appContext = DetailPageContext.AnyModifiers;
        this.isAwaitingInput = true;
    }

    private async handlerModifierEvent(transcript: string) {
        if(transcript === "yes") {
            this.preConditionEvent();
            return;
        } else if(transcript === "no") {
            const errMsg = "Sorry doctor. Modifiers are needed. Preparing for modifiers";
            await this.speech$.PollySpeak(errMsg);
            this.preConditionEvent();
            return;
        } else {
            const errMsg =`Sorry doctor. Cannot recognize ${transcript}. Valid answers are yes or no`;
            await this.speech$.PollySpeak(errMsg);
            this.isAwaitingInput = true;
        }
    }

    private async preConditionEvent() {
        const msg = "Does the patient have a pre-existing condition?";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.PreExistingCondition;
        this.isAwaitingInput = true;
    }

    private async handlePreCondition(transcript: string) {
        if(transcript === "yes") {
            this.procedureDetails.preExistCondition = {
                init: true,
                value: true
            };
            this.ngZone.run(() => this.preCondition = "1");
            this.neoplasmEvent();
        } else if(transcript === "no") {
            this.procedureDetails.preExistCondition = {
                init: true,
                value: false
            };
            this.ngZone.run(() => this.preCondition = "2");
            this.neoplasmEvent();
        } 
        else {
            const errMsg = `Sorry doctor. Cannot recognize ${transcript}. Valid answers are yes or no`;
            await this.speech$.PollySpeak(errMsg);
            this.isAwaitingInput = true;
        }
    }

    private async neoplasmEvent() {
        const msg = "Are you screening for malignant neoplasm?";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.MalignantNeoplasm;
        this.isAwaitingInput = true;
    }

    private async handleNeoplasm(transcript: string) {
        if(transcript === "yes") {
            this.procedureDetails.screenForNeoplasm = {
                init: true,
                value: true
            };
            this.ngZone.run(() => this.malneoplasm = "1");
            this.procPerformedEvent();
        } else if(transcript === "no")  {
            this.procedureDetails.screenForNeoplasm = {
                init: true,
                value: false
            };
            this.ngZone.run(() => this.malneoplasm = "2");
            this.procPerformedEvent();
        }
        else {
            const errMsg = `Sorry doctor. Cannot recognize ${transcript}. Valid answers are yes or no`;
            await this.speech$.PollySpeak(errMsg);
            this.isAwaitingInput = true;
        }
    }

    private async procPerformedEvent() {
        const msg = "is this procedure being performed through the stomach or anus?";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.ProcedurePerformedWay;
        this.isAwaitingInput = true;
    }

    private async handleProcPerformed(transcript: string)  {
        if(this.anusAltWordList.includes(transcript)) {
            this.procedureDetails.procPerformedWay = "Anus";
            this.ngZone.run(() => this.procPerfWay = "2");
            this.doctorStateEvent();
        } else if(transcript === "stomach") {
            this.procedureDetails.procPerformedWay = "Stomach";
            this.ngZone.run(() => this.procPerfWay = "1");
            this.doctorStateEvent();
        } else {
            const errMsg = `Sorry doctor. ${transcript} is not valid answer. Valid answers are stomach or anus`;
            await this.speech$.PollySpeak(errMsg);
            this.isAwaitingInput = true;
        }
    }

    private async doctorStateEvent() {
        const msg = "very well. Please proceed Dr. Smith";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.DoctorState;
        this.isAwaitingInput = true;
    }

    private async handleDoctorState(transcript: string) {
        if(this.doctorNoteStopWordList.includes(transcript)) {
            this.missModEvent();
        } else {
            this.ngZone.run(() => {
                let newLine = "\r\n";
                if(this.procNote) {
                    this.procNote = this.procNote + newLine + transcript;
                } else {
                    this.procNote = transcript.trim();
                }
            });
            this.procedureDetails.procedureNotes.push(transcript);
            this.isAwaitingInput = true;
        }
    }

    private async missModEvent() {
        const msg = "Did we miss any modifiers?";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.MissModifier;
        this.isAwaitingInput = true;
    }

    private async handleMissMod(transcript: string) {
        if(transcript === "yes") {
            this.screenCompleteEvent();
        } else if(transcript === "no") {
            this.screenCompleteEvent();
        } else {
            const errMsg = `Sorry doctor. ${transcript} is not a valid answer. Valid answers are yes or no`;
            await this.speech$.PollySpeak(errMsg);
            this.isAwaitingInput = true; 
        }
    }

    private async screenCompleteEvent() {
        const msg = "Doctor is screening complete?";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.ScreeningComplete;
        this.isAwaitingInput = true;
    }

    private async handleScreenComplete(transcript: string) {
        if(transcript === "yes") {
            this.updateRecordEvent();
        } else if(transcript === "no") {
            this.updateRecordEvent();
        } else {
            const errMsg = `Sorry doctor. ${transcript} is not a valid answer. Valid answers are yes or no`;
            await this.speech$.PollySpeak(errMsg);
            this.isAwaitingInput = true;
        }
    }

    private async updateRecordEvent() {
        const msg = "May I update patient record?";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.UpdateRecord;
        this.isAwaitingInput = true;
    }

    private async handleUpdateRecord(transcript: string) {
        if(transcript === "yes") {
            this.updateBillingEvent();
        } else if(transcript === "no") {
            this.updateBillingEvent();
        } else {
            const errMsg = `Sorry doctor. ${transcript} is not a valid answer. Valid answers are yes or no`;
            await this.speech$.PollySpeak(errMsg);
            this.isAwaitingInput = true;
        }
    }

    private async updateBillingEvent() {
        const msg = "May I update billing record as standard Medicare screening code G0121 with a Z12.11 encounter?";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.UpdateBilling;
        this.isAwaitingInput = true;
    }

    private async handleUpdateBilling(transcript: string) {
        if(transcript === "yes") {
            this.procedureDetails.icdCode.push("Z12.11");
            this.procedureDetails.cptCode.push("G0121");
            this.ngZone.run(() => {
                this.icdInfo.nativeElement.value = "Z12.11";
                this.cpt.nativeElement.value = "G0121";
            });
            this.showSummary();
        } else if(transcript === "no") {
            this.showSummary();
        } else {
            const msg = `Sorry doctor. ${transcript} is not a valid answer. Valid answers are yes or no`;
            await this.speech$.PollySpeak(msg);
            this.isAwaitingInput = true;
        }
    }

    private async showSummary() {
        const msg = "Here is the summary of the procedure doctor. May i proceed to submit the details";
        await this.speech$.PollySpeak(msg);
        this.appContext = DetailPageContext.Summary;
        this.openDialog();
        this.isAwaitingInput = true;
    }

    private async handleSummary(transcript: string) {
        if(transcript === "yes") {
            // const newCount = this.isDoc ? (this.docFiles.length + 1) : 1;
            // const newFileName = `Wilson_${newCount}`;
            // console.log("File Name", newFileName);
            // const file = {
            //     ...this.procedureDetails,
            //     fileName: newFileName
            // };
            // await this.api$.PostProcDetail(file);
            this.api$.UpdateCSV(this.procedureDetails);
            this.dialog.closeAll();
            this.completeProc();
        } else if(transcript === "no") {
            this.dialog.closeAll();
        } else {
            const msg = `Sorry doctor. ${transcript} is not a valid answer. Valid answers are yes or no`;
            await this.speech$.PollySpeak(msg);
            this.isAwaitingInput = true;
        }
    }   

    private async completeProc() {
        const msg = "Thank you doctor. Your notes are saved for your reference";
        await this.speech$.PollySpeak(msg);
        this.ngZone.run(() => this.patientInfo.selectedIndex = 0);
    }

    public tabChanged(event: MatTabChangeEvent) {
        this.currentTab = event.index;
    }

    public openDialog() {
        this.dialog.open(DialogComponent, {
            data: this.procedureDetails
        });
    }

    private async logout() {
        const msg = "Goodbye doctor smith. Logging off";
        await this.speech$.PollySpeak(msg);
        this.router.navigateByUrl('login');
        this.aws$.CloseSocket();
    }

    ngOnDestroy() {
        this.destroySubs.next();
        this.destroySubs.complete();
    }
}
