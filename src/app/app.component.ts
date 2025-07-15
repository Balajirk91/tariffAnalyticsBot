import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AppService } from './app.service';
import { v4 as uuidV4 } from 'uuid';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { FormBuilder } from './formbuilder';

export interface Message {
  body: {
    message: any;
    userid: any;
    formFields?: Field[] | null;
    base64pdf?: string;
  };
  isRequest: boolean;
  timeStamp: number;
}

export interface GeneralForm {
  type: string;
  fields: Field[];
}

export interface Field {
  label: string;
  name: string;
  type: string;
  required: boolean;

  // Optional properties for field-specific logic
  value?: any; // For default text/number
  default?: any; // For initial values like "Gold", "India", etc.
  options?: string[]; // For select dropdowns
  fields?: Field[]; // For nested/dynamic_list fields
}

@Component({
  selector: 'demo-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  messages: Message[] = [];
  newMsg = '';
  isLoading = false;
  selectedFile: File | null = null;
  generatedUserId: any;
  formGroup: any;
  formGroupFields: Field[] = [];
  base64String: any;
  threadid: string = '';
  downloadresponse: string = '';

  constructor(
    private myService: AppService,
    private formbuilder: FormBuilder
  ) {}
  // Scroll to latest user request
  @ViewChild('lastUserMessageElem') set lastUserMessageElem(
    el: ElementRef | undefined
  ) {
    if (el) {
      setTimeout(() => {
        el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // Scroll to latest bot response
  @ViewChild('lastBotMessageElem') set lastBotMessageElem(
    el: ElementRef | undefined
  ) {
    if (el) {
      setTimeout(() => {
        el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

// Use this.fileInput.nativeElement.value = '' whenever needed


  ngOnInit(): void {
    this.isLoading = true;
    this.generateUserIdAndInitialMessage();
  }

  generateUserIdAndInitialMessage() {
  this.generatedUserId = uuidV4();
  this.generatedUserId = this.generatedUserId.split('-')[0]
  setTimeout(() => {
    this.messages.push({
      body: {
        message:
          "Hi! I’m your Gen AI Trade and Invoice Assistant. How can I assist you today?\nYou can upload your invoice for processing, or I can help you generate a new invoice and provide a summary.",
        userid: this.generatedUserId,
      },
      isRequest: false,
      timeStamp: Date.now(),
    });
    this.isLoading = false;
  }, 1000);
}

  handleEnter(event: any) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onFileSelected(event: any): void {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;
  
  if (file) {
    this.selectedFile = file;
    this.convertFileToBase64(file);
  } else {
    console.warn('No file selected');
  }

  // Reset file input so change event fires even if same file selected next time
  fileInput.value = '';
}


  convertFileToBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        this.base64String = result.split(',')[1];
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
    };

    reader.readAsDataURL(file);
  }



  onFormSubmit() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValues = this.formGroup.value;

    // Convert values to "Label: value" format
    const messageText = Object.entries(formValues)
      .map(([key, value]) => `${this.toLabel(key)}: ${value}`)
      .join(', ');

    this.newMsg = messageText;
    this.sendMessage();
    // Optionally clear the form after submission
    this.formGroup = null;
    this.formGroupFields = [];
  }

  toLabel(str: string): string {
    return str
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (c) => c.toUpperCase());
  }

  sendMessage() {
  if ((!this.newMsg.trim() && !this.selectedFile) || this.isLoading) return;

  const userText = {
    message: this.newMsg.trim(),
    userid: this.generatedUserId,
    base64pdf: this.base64String || '',
    thread_id: this.threadid || ''
  };

  // Show user message first
  this.messages.push({
    body: {
      message: userText.message || '[File uploaded]',
      userid: userText.userid,
      base64pdf: this.base64String || '',
    },
    isRequest: true,
    timeStamp: Date.now(),
  });

  this.isLoading = true;
  this.newMsg = '';

  const sendToAI = (prompt: any) => {
    this.selectedFile = null;
    this.base64String = '';
      this.myService.sendToFoundry(prompt).subscribe({
        next: (response: any) => {
          console.log(response, response);
          
          this.isLoading = false;
          this.threadid = response.thread_id;
          this.downloadresponse = response.response;
          this.messages.push({
            body: {
              message: response.response,
              userid: this.generatedUserId,
              formFields: response?.fields ?? null
            },
            isRequest: false,
            timeStamp: Date.now(),
          });
        },
        error: () => {
          this.messages.push({
            body: {
              message: 'Error: Unable to get response',
              userid: this.generatedUserId,
            },
            isRequest: false,
            timeStamp: Date.now(),
          });
          this.isLoading = false;
        },
      });
  };
  sendToAI(userText);
}


  async buildFormFromAIResponse(response: any): Promise<FormGroup> {
    const generalFormConfig: GeneralForm[] = [
      {
        type: response.type, // "form_request"
        fields: response.fields,
      },
    ];
    const formGroup = this.formbuilder.createFormGroup(generalFormConfig);

    return formGroup;
  }

  clearChatHistory() {
    this.messages = [];
    this.isLoading = true;
    this.generateUserIdAndInitialMessage();
  }

  objectKeys(obj: any): string[] {
    console.log('obj', obj);

    return Object.keys(obj);
  }

  // Format message to replace URLs with clickable links

  //   formatMessage(message: string): string {
  //   if (!message) return '';

  //   const urlRegex = /(https?:\/\/[^\s]+)/g;

  //   // Replace all URLs with clickable "Download PDF" links
  //   return message.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">Download PDF</a>');
  // }

  // Format message to download the pdf directly

  formatMessage(message: any): string {
    if (!message.response) return message;

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return message.replace(
      urlRegex,
      `<a href="$1" download target="_blank" rel="noopener noreferrer">Download PDF</a>`
    );
  }

  download() {
    const prompt = {
    "response": this.downloadresponse,
    "form_response": "",
    "download_url": ""
}
    this.myService.download(prompt).subscribe({
      next: (response) => {
        console.log(response);
        window.open(response.download_url, '_blank');
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}
