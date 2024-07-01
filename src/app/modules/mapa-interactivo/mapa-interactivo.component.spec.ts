import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaInteractivoComponent } from './mapa-interactivo.component';

describe('MapaInteractivoComponent', () => {
  let component: MapaInteractivoComponent;
  let fixture: ComponentFixture<MapaInteractivoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapaInteractivoComponent]
    });
    fixture = TestBed.createComponent(MapaInteractivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
