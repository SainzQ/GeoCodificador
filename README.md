# GeoCodificador

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.14.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.


## Proyecto manejado por modulos
Tablero en el que mandar llamar la ventana de importar para hacer la funcion de geocodificar

## Table.module.ts
Este modulo tiene todas las importaciones necesarias que se hacen dentro de los modulos, como los modulos de primeng, angular material al igual que los component que se requieren para el desarrollo de la aplicacion 

## app.module.ts
En el modulo se manda llamar table.module.ts para hacer la integracion correcta de la aplicacion 

## Dependencias

## Primeng
Se utilizó la versión ^16.9.1 de Primeng.

## Angular Material
Se utilizó la versión ^16.2.12 de Angular Material.

## Servicio para el tablero
  private apiUrl = 'http://192.168.40.1:5985/GCSW/api/proyectos/traerProyecto/1';
En esta URL, {1} representa el ID del usuario que está realizando la geocodificación.

## Servicio para el modulo de importar
  private apiUrl = 'http://192.168.40.1:5985/GCSW/api/proyectos';


