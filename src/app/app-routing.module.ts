import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerComponent } from './pages/customers/customer.component';


const routes: Routes = [
  { path: 'menu', component: CustomerComponent },
  { path: '**', redirectTo: 'menu' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
