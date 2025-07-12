import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AppService } from './app.service';
import { v4 as uuidV4 } from 'uuid';
import { FormGroup } from '@angular/forms';
import { FormBuilder } from './formbuilder';

interface Message {
  body: {
    message: string;
    userid: any;
  };
  isRequest: boolean;
  timeStamp: number;
}

export interface GeneralForm {
  type: string;
  fields: Fields[];
}

export interface Fields {
  label: string; 
  name: string;
  type: string; 
  required: boolean;
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

  constructor(private myService: AppService,private formbuilder: FormBuilder) {}
  // Scroll to latest user request
  @ViewChild('lastUserMessageElem') set lastUserMessageElem(el: ElementRef | undefined) {
    if (el) {
      setTimeout(() => {
        el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // Scroll to latest bot response
  @ViewChild('lastBotMessageElem') set lastBotMessageElem(el: ElementRef | undefined) {
    if (el) {
      setTimeout(() => {
        el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }



  ngOnInit(): void {
    this.isLoading = true;
    this.generateUserIdAndInitialMessage();
  }

  generateUserIdAndInitialMessage() {
    this.generatedUserId = uuidV4();
    setTimeout(() => {
      this.messages.push({
        body: {
          message: 'Hi, I’m your Commercial Invoice Assistant. How can I assist you today?',
          userid: this.generatedUserId
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  sendMessage() {
    if ((!this.newMsg.trim() && !this.selectedFile) || this.isLoading) return;

    const userText = {
      message: this.newMsg.trim(),
      userid: this.generatedUserId
    }
    // Show user message
    this.messages.push({
      body: {
        message: userText.message || '[File uploaded]',
        userid: userText.userid
      },
      isRequest: true,
      timeStamp: Date.now(),
    });

    this.isLoading = true;
    this.newMsg = '';

    const sendToAI = (prompt: any) => {
      this.myService.sendToFoundry(prompt).subscribe({
        next: async (response) => {
          this.messages.push({
            body: {
              message: response,
              userid: this.generatedUserId
            },
            isRequest: false,
            timeStamp: Date.now(),
          });
          this.isLoading = false;
          this.formGroup = await this.buildFormFromAIResponse(response);
          console.log("this.formGroup", this.formGroup);
          
        },
        error: () => {
          this.messages.push({
            body: {
              message: 'Error: Unable to get response',
              userid: this.generatedUserId
            },
            isRequest: false,
            timeStamp: Date.now(),
          });
          this.isLoading = false;
        },
      });
    };

    if (this.selectedFile) {
      this.myService.uploadFileToBlob(this.selectedFile).subscribe({
        next: (url: string) => {
          const combinedPrompt = `${userText}\n\nHere is the file: ${url}`;
          sendToAI(combinedPrompt);
          this.selectedFile = null;
        },
        error: () => {
          this.messages.push({
            body: {
              message: 'Error uploading file.',
              userid: this.generatedUserId
            },
            isRequest: false,
            timeStamp: Date.now(),
          });
          this.isLoading = false;
        },
      });
    } else {
      sendToAI(userText);
    }
  }

  async buildFormFromAIResponse(response: any): Promise<FormGroup> {
    const generalFormConfig: GeneralForm[] = [
    {
      type: response.type, // "form_request"
      fields: response.fields
    }
  ];
  const formGroup = this.formbuilder.createFormGroup(generalFormConfig);

  return formGroup;
}

  clearChatHistory() {
    this.messages = [];
     this.isLoading = true;
    this.generateUserIdAndInitialMessage();
  }
}
