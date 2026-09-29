import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'client/search',
    title: 'AUTOLOG · Cliente',
    loadComponent: () =>
      import('./features/client/client-search/client-vehicle-search.component').then(
        ({ ClientVehicleSearchComponent }) => ClientVehicleSearchComponent
      )
  },
  {
    path: 'client/home',
    title: 'AUTOLOG · Portal del cliente',
    loadComponent: () =>
      import('./features/client/client-portal/client-home.component').then(
        ({ ClientHomeComponent }) => ClientHomeComponent
      )
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/mechanic-layout.component').then(
        ({ MechanicLayoutComponent }) => MechanicLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        title: 'AUTOLOG · Tablero',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            ({ DashboardComponent }) => DashboardComponent
          )
      },
      {
        path: 'vehicle-intake',
        title: 'AUTOLOG · Ingreso de vehículo',
        loadComponent: () =>
          import('./features/vehicle-intake/vehicle-intake.component').then(
            ({ VehicleIntakeComponent }) => VehicleIntakeComponent
          )
      },
      {
        path: 'service-orders/:id/edit',
        title: 'AUTOLOG · Editar servicio',
        loadComponent: () =>
          import('./features/vehicle-intake/vehicle-intake.component').then(
            ({ VehicleIntakeComponent }) => VehicleIntakeComponent
          )
      },
      {
        path: 'vehicles/:vehicleId/work-order',
        title: 'AUTOLOG · Orden de trabajo',
        loadComponent: () =>
          import('./features/work-order/work-order.component').then(
            ({ WorkOrderComponent }) => WorkOrderComponent
          )
      },
      {
        path: 'vehicles',
        title: 'AUTOLOG · Vehículos',
        loadComponent: () =>
          import('./features/vehicles/vehicle-list.component').then(
            ({ VehicleListComponent }) => VehicleListComponent
          )
      },
      {
        path: 'mechanic/vehicles',
        title: 'AUTOLOG · Vehículos del mecánico',
        loadComponent: () =>
          import('./features/vehicles/vehicle-list.component').then(
            ({ VehicleListComponent }) => VehicleListComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: 'client/search' }
];
