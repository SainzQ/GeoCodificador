import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { InteractiveMapService } from '../../services/interactive-map.service';
import Map from 'ol/Map';
import View from 'ol/View';
import { Cluster, OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import { FeatureProperties } from 'src/app/models/featureProperties.model';
import { DireccionActualizacion } from 'src/app/models/address.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartType, ChartData, ChartOptions, Chart } from 'chart.js';
import { Router } from '@angular/router';
import { Geometry } from 'ol/geom';
import { boundingExtent, containsCoordinate } from 'ol/extent';
import { TableComponent } from '../table/components/table/table.component';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-mapa-interactivo',
  templateUrl: './mapa-interactivo.component.html',
  styleUrls: ['./mapa-interactivo.component.css']
})
export class MapaInteractivoComponent implements OnInit, AfterViewInit {
  @ViewChild('map') mapElement!: ElementRef;
  public map!: Map;
  private vectorSource!: VectorSource;
  private clusterSource!: Cluster;
  public numberOfAddresses: number = 0;
  public numberOfNotValidAddresses: number = 0;
  private overlay!: Overlay;
  public displayDialog: boolean = false;
  public selectedFeature: FeatureProperties | null = null;
  public previousSelectedFeature: Feature<Point> | null = null;
  public cursorStyle: string = 'default';
  public inputDisabled: boolean = true;
  public buttonDisabledEdit: boolean = false;
  public buttonDisabledSave: boolean = true;
  public legendItems = [
    { georesultado: 'S1', color: '#059212', border: 'white', label: 'S1', count: 0, percentage: 0 },
    { georesultado: 'S2', color: '#06D001', border: 'white', label: 'S2', count: 0, percentage: 0 },
    { georesultado: 'S3', color: '#9BEC00', border: 'white', label: 'S3', count: 0, percentage: 0 },
    { georesultado: 'S4', color: '#4C3BCF', border: 'white', label: 'S4', count: 0, percentage: 0 },
    { georesultado: 'S5', color: '#3FA2F6', border: 'white', label: 'S5', count: 0, percentage: 0 },
    { georesultado: 'S6', color: '#A7E6FF', border: 'white', label: 'S6', count: 0, percentage: 0 },
    { georesultado: 'S7', color: '#E90074', border: 'white', label: 'S7', count: 0, percentage: 0 },
    { georesultado: 'N1', color: '#FFDB00', border: 'white', label: 'N1', count: 0, percentage: 0 },
    { georesultado: 'C1', color: '#FF9A00', border: 'white', label: 'C1', count: 0, percentage: 0 },
    { georesultado: 'NG', color: 'red', border: 'white', label: 'NG', count: 0, percentage: 0 },
    { georesultado: 'SD', color: 'black', border: 'white', label: 'SD', count: 0, percentage: 0 },
    { georesultado: 'ED', color: '#15F5BA', border: 'black', label: 'ED', count: 0, percentage: 0 },
  ];
  public allPoints: any[] = [];
  public direccionesSalida: any[] = [];
  public direccionesNE: any[] = [];
  public totalNumberOfAddresses: number = 0;
  public chartData: any;
  public chartOptions: any;
  selectedProject: any;
  public sortField: string = '';
  public sortOrder: number = 1;
  public mostrarPuntosCercanos: boolean = false;
  private zoomUmbral: number = 10;
  private allFeatures: Feature<Point>[] = [];
  private visibleFeatures: Feature<Point>[] = [];
  public switchDisabled: boolean = true;
  showTableroGeoresultados: boolean = false;
  showLeyendas: boolean = false;
  private vectorLayer!: VectorLayer<VectorSource<Feature<Geometry>>>;
  private clusterLayer!: VectorLayer<Cluster>;
  private currentGeoresultado: string = '';

  constructor(
    private mapService: InteractiveMapService,
    private confirmationService: ConfirmationService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef,
    private messageService: MessageService,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.selectedProject = navigation.extras.state['proyecto'];
    }
  }

  ngOnInit() {
    console.log('Proyecto seleccionado:', this.selectedProject.id_proyecto);
    this.getDireccionesSalida();
    this.initializeChart();
  }

  ngAfterViewInit() {
    this.initMap();
    this.addPointerMoveInteraction();
    this.updateSwitchState();
  }

  initMap() {
    this.vectorSource = new VectorSource();

    this.clusterSource = new Cluster({
      distance: 40,
      source: this.vectorSource
    });

    this.clusterLayer = new VectorLayer({
      source: this.clusterSource,
      style: (feature) => this.styleFunction(feature as Feature)
    });

    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        this.clusterLayer
      ],
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    });

    this.overlay = new Overlay({
      element: document.createElement('div'),
      autoPan: true
    });

    this.map.addOverlay(this.overlay);

    this.map.on('click', (event) => this.handleMapClick(event));

    this.map.on('moveend', () => {
      this.updateSwitchState();
      if (this.mostrarPuntosCercanos) {
        this.actualizarPuntosCercanos();
      }
    });
  }

  styleFunction(feature: Feature) {
    const features = feature.get('features') as Feature[];
    const size = features.length;
    if (size === 1) {
      return this.createPointStyle(features[0]);
    }

    const visibleFeatures = features.filter(f =>
      this.currentGeoresultado === '' ||
      f.get('properties').georesultado === this.currentGeoresultado
    );

    if (visibleFeatures.length === 0) {
      return new Style(undefined);
    }

    return new Style({
      image: new CircleStyle({
        radius: 10 + Math.min(visibleFeatures.length, 20),
        fill: new Fill({ color: 'rgba(255, 153, 0, 0.8)' })
      }),
      text: new Text({
        text: visibleFeatures.length.toString(),
        fill: new Fill({ color: '#fff' })
      })
    });
  }

  createPointStyle(feature: Feature): Style {
    const properties = feature.get('properties');
    if (this.currentGeoresultado !== '' && properties.georesultado !== this.currentGeoresultado) {
      return new Style(undefined);
    }
    const legendItem = this.legendItems.find(item => item.georesultado === properties.georesultado);
    if (legendItem) {
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: legendItem.color }),
          stroke: new Stroke({
            color: 'white',
            width: 2
          })
        }),
        text: new Text({
          text: properties.num.toString(),
          fill: new Fill({ color: '#000000' }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 3
          }),
          font: 'bold 12px Arial',
          offsetY: 1
        })
      });
    }
    return new Style(undefined);
  }

  toggleTableroGeoresultados() {
    this.showTableroGeoresultados = !this.showTableroGeoresultados;
  }

  toggleLeyendas() {
    this.showLeyendas = !this.showLeyendas;
  }

  updateSwitchState() {
    if (this.map && this.map.getView()) {
      const currentZoom = this.map.getView().getZoom() || 0;
      this.switchDisabled = currentZoom < this.zoomUmbral;
      if (this.switchDisabled && this.mostrarPuntosCercanos) {
        this.mostrarPuntosCercanos = false;
        this.updateVisibleFeatures();
      }
    }
  }

  updateMapPoints() {
    this.clearExistingPoints();

    this.addPointsToMapAddresFounded(this.direccionesSalida);
  }

  addPointerMoveInteraction() {
    this.map.on('pointermove', (evt) => {
      if (evt.dragging) {
        return;
      }
      const pixel = this.map.getEventPixel(evt.originalEvent);
      const hit = this.map.hasFeatureAtPixel(pixel);
      this.cursorStyle = hit ? 'pointer' : 'default';
      this.map.getTargetElement().style.cursor = this.cursorStyle;
    });
  }

  togglePuntosCercanos() {
    if (!this.switchDisabled) {
      this.updateVisibleFeatures();
    }
  }

  onSort(event: any) {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.sortDireccionesSalida();
  }

  sortDireccionesSalida() {
    this.direccionesSalida.sort((a, b) => {
      let result = 0;
      if (a[this.sortField] < b[this.sortField]) {
        result = -1;
      } else if (a[this.sortField] > b[this.sortField]) {
        result = 1;
      }
      return this.sortOrder * result;
    });
  }

  actualizarPuntosCercanos() {
    const zoom = this.map.getView().getZoom();
    if (zoom && zoom >= this.zoomUmbral) {
      const extent = this.map.getView().calculateExtent(this.map.getSize());
      this.visibleFeatures = this.allFeatures.filter(feature => {
        const geometry = feature.getGeometry();
        if (geometry instanceof Point) {
          return containsCoordinate(extent, geometry.getCoordinates());
        }
        return false;
      });
      this.vectorSource.clear();
      this.vectorSource.addFeatures(this.visibleFeatures);
      this.updateTableData();
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Zoom insuficiente',
        detail: 'Acerca más el mapa para ver los puntos cercanos.'
      });
    }
  }

  updateTableData() {
    setTimeout(() => {
      this.direccionesSalida = this.visibleFeatures.map(feature => feature.getProperties()['properties']);
      this.cd.detectChanges();
    }, 0);
  }

  filtrarPuntosValidos(puntos: Feature<Geometry>[]): Feature<Point>[] {
    return puntos.filter((feature): feature is Feature<Point> => {
      const geometry = feature.getGeometry();
      return geometry instanceof Point;
    });
  }

  mostrarPuntosEnPanel(puntos: Feature<Point>[]) {
    this.direccionesSalida = puntos.map(feature => feature.getProperties()['properties']);
    this.cd.detectChanges();
  }

  handleMapClick(event: any) {
    const feature = this.map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
    if (feature) {
      const features = feature.get('features');
      if (features && features.length > 1) {
        const extent = boundingExtent(
          features
            .map((f: Feature<Point>) => {
              const geom = f.getGeometry();
              return geom ? geom.getCoordinates() : undefined;
            })
            .filter((coord: number[] | undefined): coord is number[] => coord !== undefined)
        );
        if (extent && extent.length === 4) {
          this.map.getView().fit(extent, { duration: 1000, padding: [50, 50, 50, 50] });
        } else {
          console.error('Invalid extent calculated from cluster');
        }
      } else if (features && features.length === 1) {
        this.showFeatureInfo(features[0]);
      } else {
        console.error('Unexpected feature structure', features);
      }
    } else {
      this.overlay.setPosition(undefined);
      this.selectedFeature = null;
      this.displayDialog = false;
    }
  }

  showFeatureInfo(feature: Feature<Point>) {
    const geometry = feature.getGeometry();
    if (geometry) {
      const coordinates = geometry.getCoordinates();
      this.selectedFeature = feature.getProperties()['properties'] as FeatureProperties;

      this.displayDialog = true;
      this.overlay.setPosition(coordinates);
    } else {
      console.error('Feature has no geometry', feature);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede mostrar información para este punto'
      });
    }
  }

  onDialogHide() {
    this.selectedFeature = null;
  }

  getDireccionesSalida() {
    this.mapService.getAddress(this.selectedProject.id_proyecto).subscribe(
      (response: any) => {
        if (response.status === 200) {
          this.clearExistingPoints();
          this.direccionesSalida = response.direcciones_salida;
          this.direccionesNE = response.direcciones_ne;
          this.addPointsToMapAddresFounded(response.direcciones_salida);
          this.numberOfAddresses = response.direcciones_salida.length;
          this.numberOfNotValidAddresses = response.direcciones_ne.length;
          this.totalNumberOfAddresses = response.direcciones_salida.length + response.direcciones_ne.length;
          console.log('Número de direcciones totales:', this.totalNumberOfAddresses);
          console.log('Número de direcciones encontradas:', this.numberOfAddresses);
          console.log('Número de direcciones no encontradas:', this.numberOfNotValidAddresses);
          this.updateChartData();
        }
      },
      error => console.error('Error fetching addresses:', error)
    );
  }

  initializeChart() {
    this.chartOptions = {
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          enabled: false
        },
        datalabels: {
          color: '#ffffff',
          anchor: 'center',
          align: 'center',
          formatter: (value: number, ctx: {
            chart: { data: ChartData },
            dataIndex: number,
            dataset: { data: number[] }
          }) => {
            const dataset = ctx.dataset;
            const total = dataset.data.reduce((acc: number, data: number) => acc + data, 0);
            const percentage = (value / total) * 100;
            const label = ctx.chart.data.labels?.[ctx.dataIndex] as string;

            return percentage > 0.01 ? `${label}\n${percentage.toFixed(1)}%` : '';
          },
          font: {
            weight: 'bold' as const,
            size: 14
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      cutout: '40%'
    } as ChartOptions<'pie'>;
  }

  updateChartData() {
    console.log('Actualizando datos de la gráfica');
    console.log('Datos de leyenda:', this.legendItems);
    this.chartData = {
      labels: this.legendItems.map(item => item.label),
      datasets: [{
        data: this.legendItems.map(item => item.count),
        backgroundColor: [
          '#4CAF50', '#8BC34A', '#CDDC39',
          '#2196F3', '#03A9F4', '#00BCD4',
          '#E90074', '#FFC107', '#FF9800', '#FF5722',
          '#000000', '#15F5BA'
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    } as ChartData<'pie', number[], string>;
    console.log('Datos de la gráfica actualizados:', this.chartData);
  }

  selectPoint(point: any, isDireccionSalida: boolean) {
    if (isDireccionSalida) {
      const feature = this.vectorSource.getFeatures().find(f =>
        f.getProperties()['properties'].id_direccion_salida === point.id_direccion_salida
      );

      if (feature && feature.getGeometry() instanceof Point) {
        const geometry = feature.getGeometry() as Point;
        this.map.getView().animate({
          center: geometry.getCoordinates(),
          zoom: 18,
          duration: 1000
        });
        this.handleFeatureSelection(feature as Feature<Point>);
      }
    } else {
      console.log('Dirección no encontrada:', point);
      this.messageService.add({
        severity: 'info',
        summary: 'Dirección no encontrada',
        detail: 'Esta dirección no se puede mostrar en el mapa.'
      });
    }
  }

  handleFeatureSelection(feature: Feature<Point>) {
    if (this.previousSelectedFeature) {
      this.previousSelectedFeature.setStyle(this.previousSelectedFeature.get('originalStyle'));
    }

    const geometry = feature.getGeometry();
    if (geometry) {
      const coordinates = geometry.getCoordinates();
      this.selectedFeature = feature.getProperties()['properties'] as FeatureProperties;

      const originalStyle = feature.getStyle() as Style;
      feature.set('originalStyle', originalStyle);
      feature.setStyle(this.createSelectedStyle(originalStyle));
      this.previousSelectedFeature = feature;

      this.displayDialog = true;
      this.overlay.setPosition(coordinates);
    }
  }

  createSelectedStyle(baseStyle: Style) {
    const baseImage = baseStyle.getImage() as CircleStyle;
    const baseText = baseStyle.getText();
    return new Style({
      image: new CircleStyle({
        radius: baseImage.getRadius() * 1.2,
        fill: baseImage.getFill() || undefined,
        stroke: new Stroke({
          color: 'yellow',
          width: 3
        })
      }),
      text: baseText || undefined
    });
  }

  clearExistingPoints() {
    if (this.vectorSource) {
      this.vectorSource.clear();
    }
  }

  async addPointsToMapAddresFounded(addresses: any[]) {
    let validAddresses = 0;

    this.legendItems.forEach(item => {
      item.count = 0;
      item.percentage = 0;
    });

    const features: Feature<Point>[] = addresses.reduce((acc: Feature<Point>[], address, index) => {
      if (address.coordx && address.coordy) {
        validAddresses++;
        const coords = fromLonLat([parseFloat(address.coordx), parseFloat(address.coordy)]);
        const feature = new Feature<Point>({
          geometry: new Point(coords),
          properties: address
        });

        const legendItem = this.legendItems.find(item => item.georesultado === address.georesultado);
        if (legendItem) {
          legendItem.count++;
          acc.push(feature);
        }
      }
      return acc;
    }, []);

    this.legendItems.forEach(item => {
      item.percentage = (item.count / validAddresses) * 100;
    });

    console.log('Direcciones válidas procesadas:', validAddresses);

    if (features.length > 500) {
      const useCluster = await this.confirmClusterUse();
      this.initializeLayer(features, useCluster);
    } else {
      this.initializeLayer(features, false);
    }

    if (features.length > 0 && this.map && this.map.getView()) {
      const extent = this.vectorSource.getExtent();
      if (extent && extent.length === 4 && !extent.some(isNaN)) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000
        });
      } else {
        console.error('Invalid extent calculated from features');
      }
    } else {
      console.error('Map or map view is not initialized, or no valid features');
    }

    this.allFeatures = features;
    this.updateVisibleFeatures();
  }

  initializeLayer(features: Feature<Point>[], useCluster: boolean) {
    // Primero, eliminamos cualquier capa existente
    if (this.clusterLayer) {
      this.map.removeLayer(this.clusterLayer);
    }
    if (this.vectorLayer) {
      this.map.removeLayer(this.vectorLayer);
    }

    this.vectorSource = new VectorSource({
      features: features
    });

    if (useCluster) {
      this.clusterSource = new Cluster({
        distance: 40,
        source: this.vectorSource
      });
      this.clusterLayer = new VectorLayer({
        source: this.clusterSource,
        style: (feature) => this.styleFunction(feature as Feature)
      });
      this.map.addLayer(this.clusterLayer);
    } else {
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource,
        style: (feature) => this.createPointStyle(feature as Feature<Point>)
      });
      this.map.addLayer(this.vectorLayer);
    }
  }

  async confirmClusterUse(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.messageService.add({
        key: 'clusterConfirm',
        sticky: true,
        severity: 'info',
        summary: 'Recomendación',
        detail: 'Se han detectado más de 500 puntos. Se recomienda usar clustering para mejorar el rendimiento. ¿Desea usar clustering?',
        closable: false,
        data: {
          accept: () => {
            this.messageService.clear('clusterConfirm');
            resolve(true);
          },
          reject: () => {
            this.messageService.clear('clusterConfirm');
            resolve(false);
          }
        }
      });
    });
  }

  initializeClusterLayer(features: Feature<Point>[]) {
    this.vectorSource.addFeatures(features);
    this.clusterSource = new Cluster({
      distance: 40,
      source: this.vectorSource
    });
    this.clusterLayer = new VectorLayer({
      source: this.clusterSource,
      style: (feature) => this.styleFunction(feature as Feature)
    });
    this.map.addLayer(this.clusterLayer);
  }

  initializePointLayer(features: Feature<Point>[]) {
    this.vectorSource.addFeatures(features);
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: (feature) => this.createPointStyle(feature as Feature<Point>)
    });
    this.map.addLayer(this.vectorLayer);
  }

  updateVisibleFeatures() {
    if (this.mostrarPuntosCercanos) {
      this.actualizarPuntosCercanos();
    } else {
      this.visibleFeatures = this.allFeatures;
      this.vectorSource.clear();
      this.vectorSource.addFeatures(this.visibleFeatures);
    }
    this.updateTableData();
  }

  editarInformacionSalida() {
    this.inputDisabled = false;
    this.buttonDisabledSave = false;
    this.buttonDisabledEdit = true;
  }

  actualizarInformacionSalida() {
    if (!this.selectedFeature) {
      console.error('No feature selected');
      return;
    }

    const actualizacion: DireccionActualizacion = {
      id_direccion_salida: this.selectedFeature.id_direccion_salida,
      direccion: {
        id_req: this.selectedFeature.id_req,
        nombre: this.selectedFeature.nombre,
        calle: this.selectedFeature.calle,
        numero_exterior: this.selectedFeature.numero_exterior,
        numero_interior: this.selectedFeature.numero_interior,
        colonia: this.selectedFeature.colonia,
        codigo_postal: this.selectedFeature.codigo_postal,
        municipio: this.selectedFeature.municipio,
        estado: this.selectedFeature.estado,
        region: this.selectedFeature.region,
        esquina1: this.selectedFeature.esquina1,
        esquina2: this.selectedFeature.esquina2,
        coordx: parseFloat(this.selectedFeature.coordx),
        coordy: parseFloat(this.selectedFeature.coordy),
        nse: this.selectedFeature.nse,
        ageb: this.selectedFeature.ageb,
        telefono: this.selectedFeature.telefono,
        correo: this.selectedFeature.correo,
        comentarios_dom: this.selectedFeature.comentarios_dom,
        referencias_dom: this.selectedFeature.referencias_dom
      }
    };

    this.mapService.actualizarDireccion(actualizacion).subscribe(
      response => {
        console.log('Dirección actualizada exitosamente:', response);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Dirección actualizada correctamente' });
        this.ngZone.run(() => {
          this.inputDisabled = true;
          this.buttonDisabledSave = true;
          this.buttonDisabledEdit = false;
          this.cerrarDialog();
          this.getDireccionesSalida();
          this.cd.detectChanges();
        });
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error en la actualización' });
        console.error('Error al actualizar la dirección:', error);
      }
    );
    this.getDireccionesSalida();
  }

  filterByGeoresultado(georesultado: string) {
    this.currentGeoresultado = georesultado;
    this.clusterSource.changed();
    this.cerrarDialog();
  }

  createClusterStyle(size: number): Style {
    return new Style({
      image: new CircleStyle({
        radius: 10 + Math.min(size, 20),
        fill: new Fill({ color: 'rgba(255, 153, 0, 0.8)' })
      }),
      text: new Text({
        text: size.toString(),
        fill: new Fill({ color: '#fff' })
      })
    });
  }

  showAllPoints() {
    this.currentGeoresultado = '';
    this.clusterSource.changed();
    this.cerrarDialog();
  }

  cerrarDialog() {
    this.ngZone.run(() => {
      this.inputDisabled = true;
      this.buttonDisabledSave = true;
      this.buttonDisabledEdit = false;
      this.displayDialog = false;
      this.cd.detectChanges();
    });
  }

  getColorForGeoresultado(georesultado: string): string {
    const legendItem = this.legendItems.find(item => item.georesultado === georesultado);
    return legendItem ? legendItem.color : '#F0F0F0';
  }

}
