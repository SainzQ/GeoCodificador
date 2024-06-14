import { Directive, Input, OnChanges, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appRecargarComponente]'
})
export class RecargarComponenteDirective implements OnChanges {

  @Input() appRecargarComponente:  number = 0;

  constructor(private templateRef: TemplateRef<any>, private viewContainerRef: ViewContainerRef) {
    this.viewContainerRef.createEmbeddedView(templateRef);

  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appRecargarComponente']) {
      console.log('Recargando componente');
      this.viewContainerRef.clear();
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    }
  }

}