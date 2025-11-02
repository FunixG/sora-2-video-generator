import {Injectable} from "@angular/core";

@Injectable({providedIn: 'root'})
export default class NotificationService {

    toasts: NotificationToast[] = []

    public error(text: string): void {
        this.toasts.push(new NotificationToast(text, 10000, true))
    }

    public info(text: string): void {
        this.toasts.push(new NotificationToast(text))
    }

    public remove(toast: NotificationToast): void {
        this.toasts = this.toasts.filter(t => t !== toast)
    }

}

export class NotificationToast {
    text: string;
    delay: number = 7000;
    error: boolean = false;

    constructor(text: string, delay: number = 7000, error: boolean = false) {
        this.text = text;
        this.delay = delay;
        this.error = error;
    }
}