import { Component, Input, ViewChild } from "@angular/core";
import { IonIcon, IonInput } from "@ionic/angular";

type MaybePromise<T> = T | Promise<T>

@Component({
    selector: 'app-edit-field',
    templateUrl: 'template.html',
    styleUrls: ['style.sass']
})
export class EditFieldComponent {

    @ViewChild(IonInput)
    private input?: IonInput

    @ViewChild(IonIcon)
    private icon?: IonIcon

    @Input()
    /** updater function. it can modify the given string, or return null to indicate failure */
    public updater?: (val: string) => MaybePromise<string|null>

    @Input()
    private value: string = ''

    private loading = false
    private prevValue: string | null = null

    didFocus() {
        if (!this.input || !this.icon)
            return
        if (this.prevValue != null)
            this.prevValue = 'checkmark-outline'
    }

    didBlur() {
        // if (this.prevValue != null && this.icon)
        //     this.icon.name = 'close-outline'
    }

    didChange() {
        if (this.prevValue == null) {
            this.prevValue = this.value
            if (this.icon) {
                this.icon.name = 'checkmark-outline'
            }
        }
    }

    async didClickIcon() {
        if (!this.input || !this.icon)
            return
        
        // reject changes
        // if (this.icon.name == 'close-outline') {
        //     this.value = this.prevValue ?? ''
        //     this.prevValue = null
        //     this.icon.name = 'create-outline'
        //     return
        // }

        // update
        let newString: string | null = this.prevValue
        if (this.updater) {
            this.loading = true
            newString = await this.updater(this.value)
            this.loading = false
        }
        
        if (newString != null) {
            this.prevValue = null
            this.icon.name = 'create-outline'
        }
    }

}