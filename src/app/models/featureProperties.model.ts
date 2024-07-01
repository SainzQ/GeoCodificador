export interface FeatureProperties {
    id_direccion_salida: number;
    id_req: string;
    nombre: string;
    calle: string;
    numero_exterior: string;
    numero_interior: string | null;
    colonia: string;
    codigo_postal: string;
    municipio: string;
    estado: string;
    region: string;
    esquina1: string | null;
    esquina2: string | null;
    coordx: string;
    coordy: string;
    nse: string;
    ageb: string;
    cuadrante: string | null;
    scoring: string;
    georesultado: string;
    id_proyecto: number;
    telefono: string;
    correo: string | null;
    comentarios_dom: string | null;
    referencias_dom: string | null;
    id_proceso: number;
  }