import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargarArchivoComponent } from './cargar-archivo.component';

describe('CargarArchivoComponent', () => {
  let component: CargarArchivoComponent;
  let fixture: ComponentFixture<CargarArchivoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CargarArchivoComponent]
    });
    fixture = TestBed.createComponent(CargarArchivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
