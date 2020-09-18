import { Actor } from "./enums/actors.enum";

export interface VLog {
    target: Actor;
    msg: string;
    isAstraActive?: boolean;
    isSpeakerActive?: boolean;
}