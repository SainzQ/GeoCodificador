export interface Customer {
    id_proyecto: number;
    id_usuario: number;
    nombre: string;
    resultado_proceso: string;
    numero_registros: number;
    // rgeocodificacion: string;
    fecha_creacion: Date;
    fecha_geocodificacion: Date;
    estatus_geocodificacion: string;
  }
  