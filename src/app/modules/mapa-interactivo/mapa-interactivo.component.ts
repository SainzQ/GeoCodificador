import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { InteractiveMapService } from '../../services/interactive-map.service';
import Map from 'ol/Map';
import View from 'ol/View';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';
import { FeatureProperties } from 'src/app/models/featureProperties.model';
import { DireccionActualizacion } from 'src/app/models/address.model';
import { MessageService } from 'primeng/api';

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
    { georesultado: 'S1', color: '#059212', label: 'S1', count: 0 },
    { georesultado: 'S2', color: '#06D001', label: 'S2', count: 0 },
    { georesultado: 'S3', color: '#9BEC00', label: 'S3', count: 0 },
    { georesultado: 'S4', color: '#4C3BCF', label: 'S4', count: 0 },
    { georesultado: 'S5', color: '#3FA2F6', label: 'S5', count: 0 },
    { georesultado: 'S6', color: '#A7E6FF', label: 'S6', count: 0 },
    { georesultado: 'N1', color: '#FFDB00', label: 'N1', count: 0 },
    { georesultado: 'C1', color: '#FF9A00', label: 'C1', count: 0 },
    { georesultado: 'NG', color: 'red', label: 'NG', count: 0 },
    { georesultado: 'SD', color: 'black', label: 'SD', count: 0 },
    { georesultado: 'ED', color: '#15F5BA', label: 'ED', count: 0 },
  ];

  constructor(
    private mapService: InteractiveMapService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.getDireccionesSalida();
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
    this.mapService.getAddress(32).subscribe(
      (response: any) => {
        if (response.status === 200) {
          this.clearExistingPoints();
          this.addPointsToMapAddresFounded(response.direcciones_salida);
          this.numberOfAddresses = response.direcciones_salida.length;
          this.numberOfNotValidAddresses = response.direcciones_ne.length;
          let totalNumberOfAddresses = response.direcciones_salida.length + response.direcciones_ne.length;
          console.log('Número de direcciones totales:', totalNumberOfAddresses)
          console.log('Número de direcciones encontradas:', this.numberOfAddresses);
          console.log('Número de direcciones no encontradas:', this.numberOfNotValidAddresses);
        }
      },
      error => console.error('Error fetching addresses:', error)
    );
  }

  clearExistingPoints() {
    if (this.vectorSource) {
      this.vectorSource.clear();
    }
  }

  addPointsToMapAddresFounded(addresses: any[]) {
    let validAddresses = 0;

    this.legendItems.forEach(item => item.count = 0);

    const features: Feature<Point>[] = addresses.reduce((acc: Feature<Point>[], address) => {
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
              radius: 4,
              fill: new Fill({ color: legendItem.color }),
              stroke: new Stroke({
                color: address.georesultado === 'ED' ? 'black' : 'white',
                width: address.georesultado === 'ED' ? 2 : 1
              })
            })
          });
          feature.setStyle(style);
          feature.set('originalStyle', style);
          acc.push(feature);
        }
      }
      return acc;
    }, []);

    console.log('Direcciones válidas procesadas:', validAddresses);

    this.vectorSource.addFeatures(features);

    if (features.length > 0 && this.map && this.map.getView()) {
      this.map.getView().fit(this.vectorSource.getExtent(), {
        padding: [50, 50, 50, 50],
        duration: 1000
      });
    } else {
      console.error('Map or map view is not initialized');
    }

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
  }

  filterByGeoresultado(georesultado: string) {
    const features = this.vectorSource.getFeatures();
    features.forEach(feature => {
      const properties = feature.getProperties()['properties'];
      if (properties.georesultado === georesultado) {
        feature.setStyle(feature.get('originalStyle'));
        this.cerrarDialog();
      } else {
        feature.setStyle(new Style({}));
      }
    });
  }

  showAllPoints() {
    const features = this.vectorSource.getFeatures();
    features.forEach(feature => {
      feature.setStyle(feature.get('originalStyle'));
      this.cerrarDialog();
    });
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
