import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private progressSource = new Subject<number>();
  progress$ = this.progressSource.asObservable();

  private filesSource = new Subject<any[]>();
  files$ = this.filesSource.asObservable();

  updateProgress(progress: number) {
    this.progressSource.next(progress);
  }

  updateFiles(files: any[]) {
    this.filesSource.next(files);
  }
}
