import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { InteractiveMapService } from '../../services/interactive-map.service';
import Map from 'ol/Map';
import View from 'ol/View';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, transform } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import { FeatureProperties } from 'src/app/models/featureProperties.model';
import { DireccionActualizacion } from 'src/app/models/address.model';
import { MessageService } from 'primeng/api';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartType, ChartData, ChartOptions, Chart } from 'chart.js';
import { Router } from '@angular/router';
import { Geometry } from 'ol/geom';

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
  public showNearbyPoints: boolean = false;
  public currentZoom: number = 0;
  public minZoomForNearby: number = 14;
  private maxDistanceKm: number = 2;
  private allFeatures: Feature<Geometry>[] = [];

  constructor(
    private mapService: InteractiveMapService,
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

  toggleNearbyPoints() {
    if (this.showNearbyPoints) {
      this.filterNearbyPoints();
    } else {
      this.showAllPoints();
    }
  }

  private filterNearbyPoints() {
    const center = this.map.getView().getCenter();
    if (!center) return;

    const centerLonLat = transform(center, 'EPSG:3857', 'EPSG:4326');

    const nearbyFeatures = this.vectorSource.getFeatures().filter(feature => {
      const geometry = feature.getGeometry();
      if (!(geometry instanceof Point)) return false;

      const coords = geometry.getCoordinates();
      const featureLonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      const distance = this.getDistanceFromLatLonInKm(centerLonLat[1], centerLonLat[0], featureLonLat[1], featureLonLat[0]);
      return distance <= this.maxDistanceKm;
    });

    this.vectorSource.clear();
    this.vectorSource.addFeatures(nearbyFeatures);
    this.updateTableWithVisibleFeatures();
  }

  private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  private updateTableWithVisibleFeatures() {
    const visibleFeatures = this.vectorSource.getFeatures();
    this.direccionesSalida = visibleFeatures.map(feature => feature.getProperties()['properties']);
    this.cd.detectChanges();
  }

  ngOnInit() {
    console.log('Proyecto seleccionado:', this.selectedProject.id_proyecto);
    this.getDireccionesSalida();
    this.initializeChart();
  }

  ngAfterViewInit() {
    this.initMap();
    this.addPointerMoveInteraction();
  }

  initMap() {
    this.vectorSource = new VectorSource();

    const vectorLayer = new VectorLayer({
      source: this.vectorSource
    });

    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: [0, 0],
        zoom: 1
      })
    });

    this.overlay = new Overlay({
      element: document.createElement('div'),
      autoPan: true
    });

    this.map.addOverlay(this.overlay);

    this.map.on('click', (event) => this.handleMapClick(event));

    this.map.getView().on('change:resolution', () => {
      this.currentZoom = this.map.getView().getZoom() || 0;
      if (this.currentZoom < this.minZoomForNearby) {
        this.showNearbyPoints = false;
        this.showAllPoints();
      }
    });
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

    this.updateMapPoints();
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

  handleMapClick(event: any) {
    const feature = this.map.forEachFeatureAtPixel(event.pixel, (feature) => feature as Feature<Point>);
    const createSelectedStyle = (baseStyle: Style) => {
      const baseImage = baseStyle.getImage() as CircleStyle;
      return new Style({
        image: new CircleStyle({
          radius: baseImage.getRadius() * 1.5,
          fill: baseImage.getFill() || undefined,
          stroke: new Stroke({
            color: 'yellow',
            width: 3
          })
        })
      });
    };

    if (this.previousSelectedFeature) {
      this.previousSelectedFeature.setStyle(this.previousSelectedFeature.get('originalStyle'));
    }

    if (feature) {
      const geometry = feature.getGeometry();
      if (geometry) {
        const coordinates = geometry.getCoordinates();
        this.selectedFeature = feature.getProperties()['properties'] as FeatureProperties;
        console.log(this.selectedFeature);

        const originalStyle = feature.getStyle() as Style;
        feature.set('originalStyle', originalStyle);
        feature.setStyle(createSelectedStyle(originalStyle));
        this.previousSelectedFeature = feature;

        this.displayDialog = true;
        this.overlay.setPosition(coordinates);
      } else {
        console.warn('Feature found but geometry is undefined');
        this.overlay.setPosition(undefined);
      }
    } else {
      this.overlay.setPosition(undefined);
      this.previousSelectedFeature = null;
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
        }
      },
      error => console.error('Error fetching addresses:', error)
    );
    this.updateChartData();
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
    this.chartData = {
      labels: this.legendItems.map(item => item.label),
      datasets: [{
        data: this.legendItems.map(item => item.count),
        backgroundColor: [
          '#4CAF50', '#8BC34A', '#CDDC39',
          '#2196F3', '#03A9F4', '#00BCD4',
          '#FFC107', '#FF9800', '#FF5722',
          '#000000', '#15F5BA'
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    } as ChartData<'pie', number[], string>;
  }

  selectPoint(point: any, isDireccionSalida: boolean) {
    if (isDireccionSalida) {
      const feature = this.vectorSource.getFeatures().find(f =>
        f.getProperties()['properties'].id_direccion_salida === point.id_direccion_salida
      );

      if (feature) {
        const geometry = feature.getGeometry();
        if (geometry && geometry instanceof Point) {
          this.map.getView().animate({
            center: geometry.getCoordinates(),
            zoom: 18,
            duration: 1000
          });
          this.handleFeatureSelection(feature as Feature<Point>);
        }
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

  addPointsToMapAddresFounded(addresses: any[]) {
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
          const style = new Style({
            image: new CircleStyle({
              radius: 15,
              fill: new Fill({ color: legendItem.color }),
              stroke: new Stroke({
                color: 'white',
                width: 2
              })
            }),
            text: new Text({
              text: (index + 1).toString(),
              fill: new Fill({ color: '#000000' }),
              stroke: new Stroke({
                color: '#ffffff',
                width: 3
              }),
              font: 'bold 14px Arial',
              offsetY: 1
            })
          });
          feature.setStyle(style);
          feature.set('originalStyle', style);
          acc.push(feature);
        }
      }
      return acc;
    }, []);

    this.legendItems.forEach(item => {
      item.percentage = (item.count / validAddresses) * 100;
    });

    console.log('Direcciones válidas procesadas:', validAddresses);

    this.allFeatures = features;
    this.vectorSource.addFeatures(features);

    if (features.length > 0 && this.map && this.map.getView()) {
      this.map.getView().fit(this.vectorSource.getExtent(), {
        padding: [50, 50, 50, 50],
        duration: 1000
      });
    } else {
      console.error('Map or map view is not initialized');
    }

    this.updateChartData();
    this.cd.detectChanges();
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
    let visibleCount = 0;
    const features = this.vectorSource.getFeatures();
    features.forEach(feature => {
      const properties = feature.getProperties()['properties'];
      if (properties.georesultado === georesultado) {
        visibleCount++;
        const originalStyle = feature.get('originalStyle') as Style;
        const newStyle = new Style({
          image: originalStyle.getImage() || undefined,
          text: new Text({
            text: visibleCount.toString(),
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({
              color: '#000000',
              width: 1
            }),
            font: '12px Arial'
          })
        });
        feature.setStyle(newStyle);
      } else {
        feature.setStyle(new Style({}));
      }
    });
    this.cerrarDialog();
  }

  showAllPoints() {
    this.vectorSource.clear();
    this.vectorSource.addFeatures(this.allFeatures);
    this.updateTableWithVisibleFeatures();
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
