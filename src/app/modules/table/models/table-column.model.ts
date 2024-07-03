export interface TableColumn {
    label: string;
    def: string;
    dataKey: string;
    format?: string;
    dataType?: 'date' | 'object';
    // data?: any[]
  }
