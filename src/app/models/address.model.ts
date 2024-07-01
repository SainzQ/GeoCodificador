export interface DireccionActualizacion {
    id_direccion_salida: number;
    direccion: {
      id_req: string;
      nombre?: string;
      calle: string;
      numero_exterior: string;
      numero_interior?: string;
      colonia: string;
      codigo_postal: string;
      municipio: string;
      estado: string;
      region: string;
      esquina1?: string;
      esquina2?: string;
      coordx: number;
      coordy: number;
      nse: string;
      ageb: string;
      telefono?: string;
      correo?: string;
      comentarios_dom?: string;
      referencias_dom?: string;
    }
  }