import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerComponent } from './pages/customers/customer.component';
import { TableCustomersComponent } from './components/table-customers/table-customers.component';


const routes: Routes = [
  { path: 'customers', component: CustomerComponent },
  {path: 'tableroApi', component: TableCustomersComponent},
  { path: '**', redirectTo: 'customers' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
