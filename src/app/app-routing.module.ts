import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerComponent } from './pages/customers/customer.component';


const routes: Routes = [
  { path: 'customers', component: CustomerComponent },
  { path: '**', redirectTo: 'customers' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
