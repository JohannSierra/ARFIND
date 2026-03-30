import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlmacenPage } from './almacen.page';

describe('AlmacenPage', () => {
  let component: AlmacenPage;
  let fixture: ComponentFixture<AlmacenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlmacenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
