import { Injectable } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { GeneralForm } from "./app.component";

@Injectable({
  providedIn: "root",
})
export class FormBuilder {
  async createFormGroup(formConfig: GeneralForm[]): Promise<FormGroup> {
    const controls: { [key: string]: FormControl } = {};
    for (const section of formConfig) {
      for (const field of section.fields) {
        const validators = field.required ? [Validators.required] : [];
        controls[field.name] = new FormControl(null, validators);
      }
    }

    return new FormGroup(controls);
  }
}