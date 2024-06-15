import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatTableModule } from '@angular/material/table';
import { TableModule } from './modules/table.module';
import { AppRoutingModule } from './app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { CustomerComponent } from './pages/customers/customer.component';
import { TableCustomersComponent } from './components/table-customers/table-customers.component';
import { RecargarComponenteDirective } from './directives/recargar-componente.directive';



@NgModule({
  declarations: [
    AppComponent,
    CustomerComponent,
    TableCustomersComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTableModule,
    TableModule,
    HttpClientModule
  ],
  providers: [RecargarComponenteDirective],
  bootstrap: [AppComponent]
})
export class AppModule { }
