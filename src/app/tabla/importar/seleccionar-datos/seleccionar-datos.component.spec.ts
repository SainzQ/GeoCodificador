import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarDatosComponent } from './seleccionar-datos.component';

describe('SeleccionarDatosComponent', () => {
  let component: SeleccionarDatosComponent;
  let fixture: ComponentFixture<SeleccionarDatosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SeleccionarDatosComponent]
    });
    fixture = TestBed.createComponent(SeleccionarDatosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
