import { Component, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Subject } from 'rxjs';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import { Patient, VLog } from 'src/app/models';
import { PatientsService } from '../patients.service';
import { AWSService, SpeechService, AstraCommandService } from 'src/app/core/services';
import { filter, takeUntil, take } from 'rxjs/operators';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss']
})
export class PatientsComponent implements OnInit, OnDestroy {

    public readonly displayedColumns: Array<string>;
    public dataSource: MatTableDataSource<Patient>;

    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

    private isAwaitingInput: boolean = false;
    private pageInit: boolean = false;

    private destroySubs: Subject<void> = new Subject();

    constructor(
        private patient$: PatientsService,
        private router: Router,
        private ngZone: NgZone,
        private aws$: AWSService,
        private speech$: SpeechService,
        private astra$: AstraCommandService
    ) { 
        this.displayedColumns = ["name", "gender", "insuranceName", "policyNo", "surgeryDate", "surgeryType", "status", "isBilled"];
    }

    ngOnInit(): void {
        this.dataSource = new MatTableDataSource(this.patient$.Data);
        this.dataSource.paginator = this.paginator;

        this.aws$.IsRecording.pipe(
            take(1)
        ).subscribe(value => {
            if(value) {
                this.pageInit = true;
                setTimeout(() => this.initPageSeq(), 2000);
            }
        });

        combineLatest(
            this.aws$.IsRecording,
            this.aws$.Transcription
        ).pipe(
            filter(([isRec, trans]) => (isRec && !!trans)),
            takeUntil(this.destroySubs)
        ).subscribe(([isRec, trans]) => {
            if(this.isAwaitingInput) {
                this.isAwaitingInput = false;
                this.ValidatePatientName(trans);
            }
        });
    }

    private async initPageSeq() {
        const queueMsg = `you have ${this.patient$.Data.length} patients in the queue.`;
        // await this.speech$.PollySpeak(queueMsg);
        const pNameMsg = queueMsg + "please confirm the patient name to proceed further";
        await this.speech$.PollySpeak(pNameMsg);
        this.isAwaitingInput = true;
    }

    private async ValidatePatientName(transcript: string) {
        if(transcript === "wilson") {
            const pFoundMsg = "Ok. Here is the patient details";
            await this.speech$.PollySpeak(pFoundMsg);
            this.ngZone.run(() => this.router.navigateByUrl("console/patients/details"));
        } else {
            const pNotFoundMsg = `Sorry! Details are not available for the patient ${transcript}`;
            // await this.speech$.PollySpeak(pNotFoundMsg);
            const pNameMsg = pNotFoundMsg + `Please confirm the new patient name again to proceed further`;
            await this.speech$.PollySpeak(pNameMsg);
            this.isAwaitingInput = true;
        }
    }

    ngOnDestroy() {
        this.destroySubs.next();
        this.destroySubs.complete();
    }
}
