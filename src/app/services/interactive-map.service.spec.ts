import { TestBed } from '@angular/core/testing';

import { InteractiveMapService } from './interactive-map.service';

describe('InteractiveMapService', () => {
  let service: InteractiveMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InteractiveMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
