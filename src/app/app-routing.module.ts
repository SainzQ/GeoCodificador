import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerComponent } from './pages/customers/customer.component';
import { MapaInteractivoComponent } from './modules/mapa-interactivo/mapa-interactivo.component';


const routes: Routes = [
  { path: 'menu', component: CustomerComponent },
  { path: 'gci', component: MapaInteractivoComponent },
  { path: '**', redirectTo: 'menu' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
