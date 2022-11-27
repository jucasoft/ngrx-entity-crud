import {SlideMenuItem} from '../../model/slide-menu-item';
import {MenuItem} from 'primeng/api';

export interface ThemeUiStoreState {
  open: boolean;
  mouseover: boolean;
  item: SlideMenuItem;
  items: MenuItem[];
}

export const initialState: ThemeUiStoreState = {
  open: false,
  mouseover: false,
  item: {breadcrumb: [], data: null},
  items: [
    {label: 'Test New', icon: 'pi pi-plus', url:'test'},
    {label: 'Test Open', icon: 'pi pi-download', url:'test'},
    {label: 'Test Namfix', icon: 'pi pi-box', url:'test'},
    {label: 'Test Sonsing', icon: 'pi pi-camera', url:'test'},
    {label: 'Test It', icon: 'pi pi-cart-plus', url:'test'},
    {label: 'Test Voyatouch', icon: 'pi pi-cog', url:'test'},
    {label: 'Test Opela', icon: 'pi pi-compass', url:'test'},
    {label: 'Test Cardify', icon: 'pi pi-discord', url:'test'},
    {label: 'Test Latlux', icon: 'pi pi-github', url:'test'},
    {label: 'Test Viva', icon: 'pi pi-prime', url:'test'},
    {label: 'Test Bigtax', icon: 'pi pi-box', url:'test'},
    {label: 'Test Job', icon: 'pi pi-camera', url:'test'},
    {label: 'Test Sonsing', icon: 'pi pi-cart-plus', url:'test'},
    {label: 'Test Sonair', icon: 'pi pi-cog', url:'test'},
    {label: 'Test Tempsoft', icon: 'pi pi-compass', url:'test'},
    {label: 'Test Wrapsafe', icon: 'pi pi-discord', url:'test'},
    {label: 'Test Sub', icon: 'pi pi-github', url:'test'},
    {label: 'Test Quo', icon: 'pi pi-prime', url:'test'},
    {label: 'Test Matsoft', icon: 'pi pi-box', url:'test'},
    {label: 'Test Ventosanzap', icon: 'pi pi-camera', url:'test'},
    {label: 'Test Redhold', icon: 'pi pi-cart-plus', url:'test'},
    {label: 'Test Tresom', icon: 'pi pi-cog', url:'test'},
    {label: 'Test Bamity', icon: 'pi pi-compass', url:'test'},
    {label: 'Test Konklab', icon: 'pi pi-discord', url:'test'},
    {label: 'Test Subin', icon: 'pi pi-github', url:'test'},
    {label: 'Test Wrapsafe', icon: 'pi pi-prime', url:'test'},
    ]
};
