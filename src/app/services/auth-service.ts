import {Injectable} from "@angular/core";

@Injectable({providedIn: 'root'})
export default class AuthService {

    private readonly localStorageTokenKey = 'openAI_bearer_token'

    getBearerToken(): string | null {
        return localStorage.getItem(this.localStorageTokenKey)
    }

    setBearerToken(token: string): void {
        localStorage.setItem(this.localStorageTokenKey, token)
    }

}
