// Importaciones necesarias para el componente
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { InteractiveMapService } from '../../services/interactive-map.service';
import Map from 'ol/Map';
import View from 'ol/View';
import { Cluster, OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Feature, { FeatureLike } from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import { FeatureProperties } from 'src/app/models/featureProperties.model';
import { DireccionActualizacion } from 'src/app/models/address.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartData, ChartOptions, Chart } from 'chart.js';
import { Router } from '@angular/router';
import { Geometry } from 'ol/geom';
import { containsCoordinate } from 'ol/extent';
import AnimatedCluster from 'ol-ext/layer/AnimatedCluster';
import { LineString } from 'ol/geom';
import { createEmpty, extend, getHeight, getWidth } from 'ol/extent';
import { MapBrowserEvent } from 'ol';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-mapa-interactivo',
  templateUrl: './mapa-interactivo.component.html',
  styleUrls: ['./mapa-interactivo.component.css']
})
export class MapaInteractivoComponent implements OnInit, AfterViewInit {
  // Propiedades del componente
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
  private clusterLayer!: AnimatedCluster;
  private currentGeoresultado: string = '';
  public clusteringActive: boolean = true;
  private circleDistanceMultiplier = 1;
  private circleFootSeparation = 28;
  private circleStartAngle = Math.PI / 2;
  private clickFeature: FeatureLike | null = null;
  private clickResolution: number | null = null;

  // Constructor del componente
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
    // Inicialización del proyecto seleccionado
  }

  // Método de inicialización del componente
  ngOnInit() {
    // Inicialización de datos y configuración del gráfico
    console.log('Proyecto seleccionado:', this.selectedProject.id_proyecto);
    this.getDireccionesSalida();
    this.initializeChart();
  }

  // Método que se ejecuta después de que la vista se ha inicializado
  ngAfterViewInit() {
    // Inicialización del mapa y configuración de interacciones
    this.initMap();
    this.addPointerMoveInteraction();
    this.updateSwitchState();
  }

  // Método para inicializar el mapa
  initMap() {
    // Crear una fuente de datos vectorial para almacenar las características (puntos, líneas, polígonos)
    this.vectorSource = new VectorSource();

    // Crear una capa vectorial que utilizará la fuente de datos anterior
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      // Definir el estilo para cada característica en la capa
      style: (feature) => this.createPointStyle(feature as Feature)
    });

    // Crear una fuente de clusters que agrupará las características cercanas
    this.clusterSource = new Cluster({
      distance: 80, // Distancia en píxeles para agrupar características
      source: this.vectorSource // Utiliza la fuente vectorial creada anteriormente
    });

    // Crear una capa de clusters animados
    this.clusterLayer = new AnimatedCluster({
      source: this.clusterSource,
      // Definir el estilo para cada cluster
      style: (feature) => this.styleFunction(feature as Feature),
      animationDuration: 700 // Duración de la animación en milisegundos
    });

    // Crear el objeto mapa principal
    this.map = new Map({
      target: this.mapElement.nativeElement, // Elemento HTML donde se renderizará el mapa
      layers: [
        // Capa base de teselas (tiles) usando OpenStreetMap
        new TileLayer({
          source: new OSM()
        }),
        this.clusterLayer // Añadir la capa de clusters al mapa
      ],
      // Configurar la vista inicial del mapa
      view: new View({
        center: [0, 0], // Centro del mapa (longitud, latitud)
        zoom: 2 // Nivel de zoom inicial
      })
    });

    // Crear un overlay (capa superpuesta) para mostrar información adicional
    this.overlay = new Overlay({
      element: document.createElement('div'), // Elemento HTML para el contenido del overlay
      autoPan: true // El mapa se desplazará automáticamente para mantener visible el overlay
    });

    // Añadir el overlay al mapa
    this.map.addOverlay(this.overlay);

    // Configurar el manejador de eventos para clics en el mapa
    this.map.on('click', (event) => this.handleMapClick(event));

    // Configurar el manejador de eventos para cuando termina un movimiento del mapa
    this.map.on('moveend', () => {
      // Actualizar el estado de algún interruptor (switch) en la interfaz
      this.updateSwitchState();
      // Si está activada la opción de mostrar puntos cercanos, actualizarlos
      if (this.mostrarPuntosCercanos) {
        this.actualizarPuntosCercanos();
      }
    });
  }

  // Método para inicializar y actualizar capas del mapa
  initializeLayer(features: Feature<Point>[], useCluster: boolean) {
    // Eliminar capas existentes si las hay
    if (this.clusterLayer) {
      this.map.removeLayer(this.clusterLayer);
    }
    if (this.vectorLayer) {
      this.map.removeLayer(this.vectorLayer);
    }

    // Verificar si hay características para mostrar
    if (features.length === 0) {
      console.warn('No features to display. Setting default view.');
      this.setDefaultView();
      return;
    }

    // Crear una nueva fuente de datos vectorial con las características proporcionadas
    this.vectorSource = new VectorSource({
      features: features
    });

    if (useCluster) {
      // Configuración para usar clústeres
      // Crear una fuente de clústeres
      this.clusterSource = new Cluster({
        distance: 40, // Distancia en píxeles para agrupar características
        source: this.vectorSource
      });

      // Crear una capa de clústeres animados
      this.clusterLayer = new AnimatedCluster({
        source: this.clusterSource,
        style: (feature) => this.styleFunction(feature as Feature)
      });

      // Añadir la capa de clústeres al mapa
      this.map.addLayer(this.clusterLayer);
    } else {
      // Configuración para no usar clústeres (puntos individuales)
      // Crear una capa vectorial normal
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource,
        style: (feature) => this.createPointStyle(feature as Feature<Point>)
      });

      // Añadir la capa vectorial al mapa
      this.map.addLayer(this.vectorLayer);
    }
  }

  initializeClusterLayer(features: Feature<Point>[]) {
    // Si existe una capa vectorial previa, la eliminamos del mapa
    if (this.vectorLayer) {
      this.map.removeLayer(this.vectorLayer);
    }

    // Si existe una capa de clústeres previa, la eliminamos del mapa
    if (this.clusterLayer) {
      this.map.removeLayer(this.clusterLayer);
    }

    // Creamos una nueva fuente de vectores con las características proporcionadas
    this.vectorSource = new VectorSource({ features: features });

    // Creamos una nueva fuente de clústeres basada en la fuente de vectores
    this.clusterSource = new Cluster({
      distance: 40, // Distancia máxima entre dos características para agruparlas en un clúster
      source: this.vectorSource
    });

    // Creamos una nueva capa de clústeres animados
    this.clusterLayer = new AnimatedCluster({
      source: this.clusterSource, // Usamos la fuente de clústeres que acabamos de crear
      style: (feature) => this.styleFunction(feature as Feature) // Aplicamos una función de estilo personalizada a cada característica
    });

    // Añadimos la nueva capa de clústeres al mapa
    this.map.addLayer(this.clusterLayer);
  }

  initializePointLayer(features: Feature<Point>[]) {
    // Si existe una capa de clústeres previa, la eliminamos del mapa
    if (this.clusterLayer) {
      this.map.removeLayer(this.clusterLayer);
    }

    // Si existe una capa vectorial previa, la eliminamos del mapa
    if (this.vectorLayer) {
      this.map.removeLayer(this.vectorLayer);
    }

    // Creamos una nueva fuente de vectores con las características (puntos) proporcionadas
    this.vectorSource = new VectorSource({ features: features });

    // Creamos una nueva capa vectorial
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource, // Usamos la fuente de vectores que acabamos de crear
      style: (feature) => this.createPointStyle(feature as Feature<Point>) // Aplicamos una función de estilo personalizada a cada punto
    });

    // Añadimos la nueva capa vectorial al mapa
    this.map.addLayer(this.vectorLayer);
  }

  // Método para manejar clics en el mapa
  handleMapClick(event: MapBrowserEvent<UIEvent>) {
    const pixel = event.pixel;
    const featuresAtPixel = this.map.getFeaturesAtPixel(pixel, {
      hitTolerance: 5,
      layerFilter: (layer) => layer === this.clusterLayer || layer === this.vectorLayer
    });

    if (featuresAtPixel && featuresAtPixel.length > 0) {
      let clickedFeature = featuresAtPixel[0] as Feature<Geometry>;

      if (clickedFeature.get('features')) {
        // Es un cluster
        const clusterFeatures = clickedFeature.get('features') as Feature<Geometry>[];
        if (this.clickFeature === clickedFeature) {
          // Ya estamos en modo "spider", intentar seleccionar un punto
          const clickedCoordinate = this.map.getCoordinateFromPixel(pixel);
          const spiderPoints = clusterFeatures.map((f: Feature<Geometry>) => f.get('spiderCoordinate'));
          const closestFeature = this.getClosestFeature(clusterFeatures, clickedCoordinate, spiderPoints);
          if (closestFeature) {
            this.showFeatureInfo(closestFeature);
          }
        } else {
          // Activar el modo "spider"
          this.handleClusterClick(clickedFeature, event);
        }
      } else {
        // Es una característica individual
        this.showFeatureInfo(clickedFeature);
      }
    } else {
      // Clic fuera de cualquier característica
      this.resetClickState();
    }
  }

  handleClusterClick(cluster: Feature<Geometry>, event: MapBrowserEvent<UIEvent>) {
    const features = cluster.get('features') as Feature<Geometry>[];
    if (features.length > 1) {
      // Si hay más de una característica, aplicar el efecto spider
      this.clickFeature = cluster;
      this.clickResolution = this.map.getView().getResolution() || 1;
      this.clusterSource.changed();

      // Forzar una actualización del mapa
      this.map.renderSync();
    } else if (features.length === 1) {
      // Si solo hay una característica, mostrar su información directamente
      this.showFeatureInfo(features[0]);
    }
  }

  resetClickState() {
    console.log('Reseteando estado de clic');
    this.overlay.setPosition(undefined);
    this.selectedFeature = null;
    this.displayDialog = false;
    this.clickFeature = null;
    this.clickResolution = null;
    this.clusterSource.changed();
    this.cd.detectChanges(); // Forzar la detección de cambios
  }

  getClosestFeature(features: Feature<Geometry>[], clickCoordinate: number[], spiderPoints: number[][]): Feature<Geometry> | null {
    let closestFeature: Feature<Geometry> | null = null;
    let minDistance = Infinity;

    features.forEach((feature, i) => {
      const spiderCoordinate = spiderPoints[i];
      const distance = this.getDistance(spiderCoordinate, clickCoordinate);
      if (distance < minDistance) {
        minDistance = distance;
        closestFeature = feature;
      }
    });

    return closestFeature;
  }

  getDistance(coord1: number[], coord2: number[]): number {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  addPointerMoveInteraction() {
    // Añade un listener al evento 'pointermove' del mapa
    this.map.on('pointermove', (evt) => {
      // Si el usuario está arrastrando el mapa, no hacemos nada
      if (evt.dragging) {
        return;
      }

      // Obtiene las coordenadas del pixel donde ocurrió el evento
      const pixel = this.map.getEventPixel(evt.originalEvent);

      // Verifica si hay alguna característica (feature) en esas coordenadas
      const hit = this.map.hasFeatureAtPixel(pixel);

      // Cambia el estilo del cursor según si está sobre una característica o no
      this.cursorStyle = hit ? 'pointer' : 'default';

      // Aplica el nuevo estilo de cursor al elemento del mapa
      this.map.getTargetElement().style.cursor = this.cursorStyle;
    });
  }

  // Métodos para actualizar y gestionar datos del mapa
  getDireccionesSalida() {
    // Llama al servicio del mapa para obtener las direcciones del proyecto seleccionado
    this.mapService.getAddress(this.selectedProject.id_proyecto).subscribe(
      (response: any) => {
        if (response.status === 200) {
          // Limpia los puntos existentes en el mapa
          this.clearExistingPoints();

          // Almacena las direcciones de salida y las direcciones no encontradas
          this.direccionesSalida = response.direcciones_salida;
          this.direccionesNE = response.direcciones_ne;

          // Si no se encontraron direcciones, establece la vista predeterminada
          if (this.direccionesSalida.length === 0 && this.direccionesNE.length === 0) {
            console.warn('No addresses found. Setting default view.');
            this.setDefaultView();
          } else {
            // Agrega los puntos de las direcciones encontradas al mapa
            this.addPointsToMapAddresFounded(response.direcciones_salida);
          }

          // Actualiza los contadores de direcciones
          this.numberOfAddresses = response.direcciones_salida.length;
          this.numberOfNotValidAddresses = response.direcciones_ne.length;
          this.totalNumberOfAddresses = response.direcciones_salida.length + response.direcciones_ne.length;

          // Registra la información en la consola
          console.log('Número de direcciones totales:', this.totalNumberOfAddresses);
          console.log('Número de direcciones encontradas:', this.numberOfAddresses);
          console.log('Número de direcciones no encontradas:', this.numberOfNotValidAddresses);

          // Actualiza los datos del gráfico
          this.updateChartData();
        }
      },
      error => console.error('Error fetching addresses:', error)
    );
  }

  async addPointsToMapAddresFounded(addresses: any[]) {
    let validAddresses = 0;

    // Reinicia los contadores de la leyenda
    this.legendItems.forEach(item => {
      item.count = 0;
      item.percentage = 0;
    });

    // Crea las características (features) para cada dirección válida
    const features: Feature<Point>[] = addresses.reduce((acc: Feature<Point>[], address, index) => {
      // Verifica si las coordenadas son válidas
      if (address.coordx && address.coordy && !isNaN(parseFloat(address.coordx)) && !isNaN(parseFloat(address.coordy))) {
        validAddresses++;
        // Convierte las coordenadas de longitud/latitud a la proyección del mapa
        const coords = fromLonLat([parseFloat(address.coordx), parseFloat(address.coordy)]);
        // Crea una nueva característica con la geometría y propiedades
        const feature = new Feature<Point>({
          geometry: new Point(coords),
          properties: address
        });

        // Actualiza el contador de la leyenda correspondiente
        const legendItem = this.legendItems.find(item => item.georesultado === address.georesultado);
        if (legendItem) {
          legendItem.count++;
          acc.push(feature);
        }
      } else {
        console.warn('Invalid coordinates for address:', address);
      }
      return acc;
    }, []);

    // Calcula los porcentajes para cada ítem de la leyenda
    this.legendItems.forEach(item => {
      item.percentage = (item.count / validAddresses) * 100;
    });

    console.log('Direcciones válidas procesadas:', validAddresses);

    // Actualiza la capa del mapa
    this.updateLayer();

    // Añade las características al mapa y ajusta la vista
    if (features.length > 0 && this.map && this.map.getView()) {
      this.vectorSource.addFeatures(features);

      // Ajusta la vista del mapa para que se muestren todas las características
      const extent = this.vectorSource.getExtent();
      if (extent && extent.some(coord => coord !== Infinity && coord !== -Infinity)) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000
        });
      } else {
        console.warn('Invalid or empty extent. Setting default view.');
        this.setDefaultView();
      }
    } else {
      console.warn('No valid features or map not initialized. Setting default view.');
      this.setDefaultView();
    }

    // Inicializa la capa con las nuevas características
    this.initializeLayer(features, this.clusteringActive);
    // Ajusta el mapa para mostrar todas las características
    this.fitMapToFeatures();

    // Actualiza las características visibles
    this.allFeatures = features;
    this.updateVisibleFeatures();
  }

  toggleTableroGeoresultados() {
    this.showTableroGeoresultados = !this.showTableroGeoresultados;
  }

  toggleLeyendas() {
    this.showLeyendas = !this.showLeyendas;
  }

  toggleClustering() {
    this.clusteringActive = !this.clusteringActive;
    this.updateLayer();
  }

  togglePuntosCercanos() {
    if (!this.switchDisabled) {
      this.updateVisibleFeatures();
    }
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

  updateLayer() {
    if (this.allFeatures.length === 0) {
      console.warn('No features to display');
      return;
    }

    if (this.clusteringActive) {
      this.initializeClusterLayer(this.allFeatures);
    } else {
      this.initializePointLayer(this.allFeatures);
    }
  }

  updateMapPoints() {
    this.clearExistingPoints();

    this.addPointsToMapAddresFounded(this.direccionesSalida);
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

  createPointStyle(feature: Feature<Geometry>): Style {
    // Extrae las propiedades relevantes de la característica
    const properties = feature.getProperties();
    const georesultado = properties['properties'].georesultado;
    const num = properties['properties'].num;

    // Obtiene el color correspondiente al 'georesultado'
    const color = this.getColorForGeoresultado(georesultado);

    // Crea y retorna un nuevo objeto Style
    return new Style({
      // Define la imagen (en este caso, un círculo) para el punto
      image: new CircleStyle({
        radius: 10,  // Radio del círculo
        fill: new Fill({ color: color }),  // Relleno del círculo con el color obtenido
        stroke: new Stroke({  // Borde del círculo
          color: 'white',
          width: 2
        })
      }),
      // Define el texto que se mostrará sobre el punto
      text: new Text({
        text: num.toString(),  // Convierte 'num' a string para usarlo como texto
        fill: new Fill({ color: '#ffffff' }),  // Color del texto
        stroke: new Stroke({  // Borde del texto para mejora de legibilidad
          color: '#000000',
          width: 3
        }),
        font: 'bold 12px Arial',  // Estilo de fuente
        offsetY: 1  // Pequeño desplazamiento vertical del texto
      })
    });
  }

  // Función auxiliar para obtener el color basado en el georesultado
  getColorForGeoresultado(georesultado: string): string {
    const legendItem = this.legendItems.find(item => item.georesultado === georesultado);
    return legendItem ? legendItem.color : '#F0F0F0'; // Color por defecto si no se encuentra
  }

  styleFunction(feature: Feature<Geometry>): Style | Style[] {
    const features = feature.get('features') as Feature<Geometry>[];
    if (!features) {
      return this.createPointStyle(feature);
    }
    const size = features.length;
    if (size === 1) {
      return this.createPointStyle(features[0]);
    }

    if (feature === this.clickFeature && this.clickResolution) {
      return this.createSpiderStyle(feature, this.clickResolution);
    }

    return this.createClusterStyle(size);
  }

  createSpiderStyle(cluster: Feature<Geometry>, resolution: number): Style[] {
    const styles: Style[] = [];
    const features = cluster.get('features') as Feature<Geometry>[];
    console.log('Número de características en el cluster:', features.length);

    const geometry = cluster.getGeometry();
    if (!(geometry instanceof Point)) {
      return styles;
    }
    const center = geometry.getCoordinates();

    const points = this.generatePointsCircle(features.length, center, resolution);

    features.forEach((feature, i) => {
      console.log('Creando estilo para característica:', feature.getProperties()['properties']);
      feature.set('spiderCoordinate', points[i], true); // El tercer parámetro true es para forzar el evento de cambio
      const point = new Point(points[i]);
      const line = new LineString([center, points[i]]);

      styles.push(new Style({
        geometry: line,
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.5)',
          width: 1
        })
      }));

      const properties = feature.getProperties();
      const georesultado = properties['properties'].georesultado;
      console.log('Proerties:', properties)
      const color = this.getColorForGeoresultado(georesultado);

      styles.push(new Style({
        geometry: point,
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: color }),
          stroke: new Stroke({ color: 'white', width: 2 })
        }),
        text: new Text({
          text: properties['properties'].num != null ? properties['properties'].num.toString() : '',
          fill: new Fill({ color: '#000000' }),
          stroke: new Stroke({ color: '#ffffff', width: 3 }),
          font: 'bold 12px Arial',
          offsetY: 1
        })
      }));
    });

    return styles;
  }

  generatePointsCircle(count: number, center: number[], resolution: number): number[][] {
    const circumference = this.circleDistanceMultiplier * this.circleFootSeparation * (2 + count);
    let legLength = circumference / (Math.PI * 2);
    const angleStep = (Math.PI * 2) / count;

    legLength = Math.max(legLength, 35) * resolution;

    const points: number[][] = [];
    for (let i = 0; i < count; i++) {
      const angle = this.circleStartAngle + i * angleStep;
      points.push([
        center[0] + legLength * Math.cos(angle),
        center[1] + legLength * Math.sin(angle)
      ]);
    }

    return points;
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

  private fitMapToFeatures() {
    if (this.vectorSource && this.map && this.map.getView()) {
      const extent = this.vectorSource.getExtent();
      if (extent && extent.some(coord => coord !== Infinity && coord !== -Infinity)) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000
        });
      } else {
        this.setDefaultView();
      }
    } else {
      this.setDefaultView();
    }
  }

  showFeatureInfo(feature: any) {
    const geometry = feature.getGeometry?.() || feature.geometry;
    if (geometry && geometry.getCoordinates) {
      const coordinates = geometry.getCoordinates();
      this.selectedFeature = feature.getProperties?.()['properties'] || feature.properties;

      this.displayDialog = true;
      this.overlay.setPosition(coordinates);

      this.inputDisabled = true;
      this.buttonDisabledSave = true;
      this.buttonDisabledEdit = false;

      // Forzar la detección de cambios
      this.cd.detectChanges();
    } else {
      console.error('Feature geometry is invalid', feature);
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

  selectPoint(point: any, isDireccionSalida: boolean) {
    if (isDireccionSalida) {
      // Busca la característica (feature) correspondiente al punto en la fuente del vector
      const feature = this.vectorSource.getFeatures().find(f =>
        f.getProperties()['properties'].id_direccion_salida === point.id_direccion_salida
      );

      // Verifica si se encontró la característica y si su geometría es un punto
      if (feature && feature.getGeometry() instanceof Point) {
        const geometry = feature.getGeometry() as Point;

        // Anima la vista del mapa para centrarla en el punto seleccionado
        this.map.getView().animate({
          center: geometry.getCoordinates(),
          zoom: 18,
          duration: 1000
        });

        // Maneja la selección de la característica
        this.handleFeatureSelection(feature as Feature<Point>);
      }
    } else {
      // Si no es una dirección de salida válida, muestra un mensaje de información
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
      this.previousSelectedFeature.setStyle(this.previousSelectedFeature.get('originalStyle') || null);
    }

    const geometry = feature.getGeometry();
    if (geometry) {
      const coordinates = geometry.getCoordinates();
      this.selectedFeature = feature.getProperties()['properties'] as FeatureProperties;

      const originalStyle = feature.getStyle();
      feature.set('originalStyle', originalStyle);
      feature.setStyle(this.createSelectedStyle(originalStyle as Style | null));
      this.previousSelectedFeature = feature;

      this.displayDialog = true;
      this.overlay.setPosition(coordinates);
    }
  }

  createSelectedStyle(baseStyle: Style | null): Style {
    if (!baseStyle) {
      return new Style({
        image: new CircleStyle({
          radius: 12,
          fill: new Fill({ color: 'yellow' }),
          stroke: new Stroke({
            color: 'black',
            width: 2
          })
        })
      });
    }

    const baseImage = baseStyle.getImage();
    const baseText = baseStyle.getText();

    let fill: Fill | undefined;
    let radius: number = 12;

    if (baseImage instanceof CircleStyle) {
      fill = baseImage.getFill() || undefined;
      radius = baseImage.getRadius() * 1.2;
    }

    return new Style({
      image: new CircleStyle({
        radius: radius,
        fill: fill || new Fill({ color: 'yellow' }),
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


  setDefaultView() {
    if (this.map && this.map.getView()) {
      this.map.getView().setCenter([0, 0]);
      this.map.getView().setZoom(2);
    }
  }

  updateVisibleFeatures() {
    if (this.currentGeoresultado) {
      this.visibleFeatures = this.allFeatures.filter(feature =>
        feature.getProperties()['properties'].georesultado === this.currentGeoresultado
      );
    } else if (this.mostrarPuntosCercanos) {
      this.actualizarPuntosCercanos();
    } else {
      this.visibleFeatures = this.allFeatures;
    }
    this.vectorSource.clear();
    this.vectorSource.addFeatures(this.visibleFeatures);
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
    this.updateVisibleFeatures();
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
    this.updateVisibleFeatures();
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
}
