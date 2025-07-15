import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AzureOpenAI } from 'openai';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import { type DxChatTypes } from 'devextreme-angular/ui/chat';
import { DataSource, CustomStore } from 'devextreme-angular/common/data';

@Injectable({
  providedIn: 'root',
})

export class AppService {
   private readonly endpoint = 'https://commercialinvoice.azurewebsites.net/api/chat?code=fdUczzZ2Z51iDXbJU2y0JA5u8oS9qccq466_Sh2-7WWoAzFuDbR_jg==';  // Replace with your Foundry chat endpoint
      private readonly downloadendpoint = 'https://commercialinvoice.azurewebsites.net/api/download?code=fdUczzZ2Z51iDXbJU2y0JA5u8oS9qccq466_Sh2-7WWoAzFuDbR_jg==';
   //private readonly apiKey = 'AxJR0MZtU3JGHU4fgW8WwuJTZ4H9g6xJq9hvhn0vgjr87BKSdTNaJQQJ99BGACHYHv6XJ3w3AAAAACOGMmMR'; // Keep this safe

  // private readonly endpoint = "https://brownboxintelligence.services.ai.azure.com/api/projects/BaseProject/agents/Orchestrator Agents/chat"
  // private readonly apiKey = '5fpA5DKgN96bqQp4dN5tOILHjrGZCmXltIG6FIp0KZOEymF6s0SOJQQJ99BGACYeBjFXJ3w3AAAAACOGvCAS'

  constructor(private http: HttpClient) {}

  sendToFoundry(prompt: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      content: prompt.message,
      userid: prompt.userid,
      base64pdf: prompt.base64pdf,
      thread_id: prompt.thread_id || ''
    };

    console.log(body);
    

    // const mockResponse = of({ response: 'You can download it using the link below:https://generateinvoice.blob.core.windows.net/generated-invoices/INV-1001.pdf?sp=r&st=2025-07-13T18:29:54Z&se=2026-07-14T02:29:54Z&sv=2024-11-04&srs=c&sig=Njik0v1lhbWrtqxrDDPPatL1BViu%2BuleIk%2B5Mxqc%3D' });

    // return mockResponse

    return this.http.post<any>(this.endpoint, body, { headers }).pipe(
      map(response => response ?? 'No response')
    );
  }

   download(prompt: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    

    return this.http.post<any>(this.downloadendpoint, prompt, { headers }).pipe(
      map(response => response ?? 'No response')
    );
  }

  uploadFileToBlob(file: File): Observable<string> {
    const blobSasUrl = 'https://<your-storage-account>.blob.core.windows.net/<container-name>/';
    const sasToken = '<your-SAS-token>'; // Optional
    const fileUrl = `${blobSasUrl}${file.name}${sasToken ? `?${sasToken}` : ''}`;

    return this.http.put(fileUrl, file, {
      headers: new HttpHeaders({
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type
      }),
      responseType: 'text'
    }).pipe(
      map(() => fileUrl)
    );
  }
}
