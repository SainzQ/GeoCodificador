import { TestBed } from '@angular/core/testing';

import { ExportarService } from './exportar.service';

describe('ExportarService', () => {
  let service: ExportarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
