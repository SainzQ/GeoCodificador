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
    //this.ngZone.runOutsideAngular(()=>{
    this.initMap();
    this.addPointerMoveInteraction();
    //})
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
        zoom: 2
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
          radius: baseImage.getRadius() * 1.5, // Aumenta el tamaño
          fill: baseImage.getFill() || undefined,
          stroke: new Stroke({
            color: 'yellow', // Cambia el color del borde
            width: 3 // Aumenta el ancho del borde
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

        // Guardar el estilo original y aplicar el estilo de selección
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

  addPointsToMapAddresFounded(addresses: any[]) {
    let validAddresses = 0;
    let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, n1 = 0, c1 = 0, ng = 0, sd = 0;

    const features: Feature<Point>[] = addresses.reduce((acc: Feature<Point>[], address) => {
      if (address.coordx && address.coordy) {
        validAddresses++;
        const coords = fromLonLat([parseFloat(address.coordx), parseFloat(address.coordy)]);
        const feature = new Feature<Point>({
          geometry: new Point(coords),
          properties: address
        });

        let style: Style;
        switch (address.georesultado) {
          case 'S1':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#365E32' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            s1++;
            break;
          case 'S2':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: 'black' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            s2++;
            break;
          case 'S3':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#06D001' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            s3++;
            break;
          case 'S4':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#0F67B1' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            s4++;
            break;
          case 'S5':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#3FA2F6' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            s5++;
            break;
          case 'S6':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#A7E6FF' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            s6++;
            break;
          case 'N1':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#FFDB00' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            n1++;
            break;
          case 'C1':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#FFAA80' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            c1++;
            break;
          case 'NG':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: 'red' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            ng++;
            break;
          case 'SD':
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#686D76' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            sd++;
            break;
          case null:
            style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#FF8F00' }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            });
            sd++;
            break;
          default:
            console.log('address.georesultado not found');
            return acc; // Skip this feature if georesultado is not recognized
        }

        feature.setStyle(style);
        feature.set('originalStyle', style);
        acc.push(feature);
      }
      return acc;
    }, []);

    console.log('Direcciones válidas procesadas:', validAddresses);
    console.log('S1:', s1, ', S2:', s2, ', S3:', s3, ', S4:', s4, ', S5:', s5, ', S6:', s6, ', N1:', n1, ', C1:', c1, ', NG:', ng, ', SD:', sd);

    this.vectorSource.addFeatures(features);

    if (features.length > 0 && this.map && this.map.getView()) {
      this.map.getView().fit(this.vectorSource.getExtent(), {
        padding: [50, 50, 50, 50]
      });
    } else {
      console.error('Map or map view is not initialized');
    }
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
        console.log('Direccion actualizada:', actualizacion);
        console.log('Dirección actualizada exitosamente:', response);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Dirección actualizada correctamente' });
        this.ngZone.run(() => {
          this.inputDisabled = true;
          this.buttonDisabledSave = true;
          this.buttonDisabledEdit = false;
          this.cd.detectChanges();
        });
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error en la actualización' });
        console.error('Error al actualizar la dirección:', error);
      }
    );
  }

}
