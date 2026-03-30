import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroalmacenPage } from './registroalmacen.page';

describe('RegistroalmacenPage', () => {
  let component: RegistroalmacenPage;
  let fixture: ComponentFixture<RegistroalmacenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroalmacenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
