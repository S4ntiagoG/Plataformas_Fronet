# AutoLog Frontend

AutoLog es un sistema de recepción y control de vehículos para un taller mecánico. Permite registrar clientes, asociar vehículos y crear órdenes de servicio con motivo de ingreso, observaciones del cliente y evidencia fotográfica.

Aplicación Angular para la recepción de vehículos, la gestión visual del taller y el portal de consulta del cliente.

El proyecto completo está dividido en dos partes:

- Backend: API REST en Java + Spring Boot + PostgreSQL
- Frontend: aplicación Angular para la captura de ingresos y consulta de vehículos/órdenes

## Stack tecnológico

### Backend
- Java 25
- Spring Boot 4.1.1
- Spring Web MVC
- Spring Data JPA
- PostgreSQL 16
- Gradle
- Docker Compose

### Frontend
- Angular 20
- TypeScript
- Standalone components
- Tailwind CSS
- RxJS

## Objetivo del sistema

El flujo principal del negocio es:

1. Registrar un cliente
2. Registrar un vehículo asociado a ese cliente
3. Crear una orden de servicio del vehículo
4. Gestionar el diagnóstico y el trabajo realizado en una orden
5. Consultar el historial de mantenimientos del vehículo

La aplicación permite capturar el ingreso, consultar y filtrar vehículos, registrar el diagnóstico y el trabajo mecánico, calcular el costo de una orden e inspeccionar el historial desde el portal cliente.

Para estudiar con más detalle el código TypeScript, la navegación, el estado y las llamadas HTTP, consulta [GUIA-LOGICA.md](GUIA-LOGICA.md). Esa guía no cubre HTML ni CSS.

Para preparar la sustentación de la entrega frontend, consulta [GUIA-SUSTENTACION.md](GUIA-SUSTENTACION.md). Incluye los flujos JWT y CRUD, decisiones de arquitectura, comandos de demostración, preguntas frecuentes y limitaciones conocidas.

## Arquitectura del proyecto

```text
Autolog-backend/
├── backend/          # API REST y persistencia
│   ├── src/main/java
│   ├── src/test/java
│   ├── docker-compose.yml
│   ├── build.gradle
│   └── gradlew
├── frontend/         # Aplicación Angular
│   ├── src/app
│   ├── package.json
│   └── proxy.conf.json
└── ../backend/postman/ # Colección de pruebas
```

## Flujo de integración frontend-backend

La interfaz no expone un único endpoint de intake. En su lugar, el frontend realiza una secuencia de llamadas HTTP para conservar la estructura de datos del backend:

1. `POST /api/clients`
2. `POST /api/vehicles` usando el `id` del cliente creado
3. `POST /api/service-orders` usando el `id` del vehículo creado

Esta secuencia está implementada en `src/app/features/vehicle-intake/services/vehicle-intake.service.ts`.

### Orden de trabajo del mecánico

1. Desde `/vehicles`, el botón de diagnóstico navega a `/vehicles/{vehicleId}/work-order`.
2. Angular solicita `GET /api/work-orders/vehicle/{vehicleId}`.
3. El backend devuelve la orden más reciente del vehículo. Si todavía no existe, crea una orden inicial asociada al vehículo.
4. El mecánico puede editar el diagnóstico y estado, marcar tareas, agregar o quitar repuestos y mano de obra.
5. `PUT /api/work-orders/{orderId}` guarda el detalle completo en una transacción y calcula los totales.
6. Las acciones de impresión usan el diálogo de impresión del navegador; el modo Invoice imprime el resumen y el detalle de costos.

Los costos siguen las tasas de la pantalla: suministros equivalen al 5% de repuestos y el impuesto al 8.5% del subtotal de repuestos, mano de obra y suministros. El backend es la fuente final de los importes guardados.

### Portal del cliente

1. El cliente ingresa la placa y el documento.
2. Angular llama a `POST /api/vehicles/search`.
3. El backend devuelve el vehículo encontrado y su última orden.
4. Angular consulta `GET /api/service-orders/vehicle/{vehicleId}`.
5. La pantalla muestra el historial ordenado por fecha, con motivo, fecha, kilometraje, observaciones y total registrado.

El botón `Detalles` y el nombre del mecánico están reservados para funcionalidades futuras. El botón no abre todavía el detalle de factura.

## Reglas de negocio importantes

- Un vehículo siempre debe pertenecer a un cliente existente.
- Una orden de servicio siempre debe estar asociada a un vehículo existente.
- La fecha de ingreso usa formato ISO: `YYYY-MM-DD`.
- El backend no gestiona archivos multipart; la aplicación valida y previsualiza imágenes localmente, y solo envía cadenas con nombres de archivo a los campos `photoFront`, `photoRightSide`, `photoBack`, `photoOdometer` y `photoExtra`.
- Los catálogos de formularios están centralizados en la capa de frontend porque la API no expone endpoints de catálogo.
- El formulario de intake no captura precios. Los costos se calcularán después mediante mano de obra e inventario.

## Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- Java 25
- Node.js 20+ y npm
- Docker Desktop
- Git
- Postman (opcional, para pruebas manuales)

## Ejecución en local

### 1. Levantar la base de datos

Desde la carpeta `backend`:

```powershell
docker compose up -d
```

Esto levanta PostgreSQL en `localhost:5432` con estas credenciales:

- Base de datos: `autolog_db`
- Usuario: `autolog`
- Contraseña: `autolog1234`

### 2. Ejecutar el backend

Desde `backend`:

Antes de iniciar sesión en el taller, configura las variables de usuario inicial y firma JWT descritas en la [guía de sustentación](GUIA-SUSTENTACION.md#6-preparar-una-demostracion).

```powershell
./gradlew bootRun
```

En Windows también puedes usar:

```powershell
.\gradlew.bat bootRun
```

La API queda disponible en:

```text
http://localhost:8080
```

### 3. Ejecutar el frontend

Desde la carpeta `frontend`:

```powershell
npm install
npm start
```

La aplicación queda en:

```text
http://localhost:4200/
```

El proxy de Angular reenvía las solicitudes `/api` a `http://localhost:8080`.

## Endpoints principales del backend

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/clients` | Lista clientes |
| POST | `/api/clients` | Crea un cliente |
| GET | `/api/clients/{id}` | Consulta un cliente por ID |
| GET | `/api/vehicles` | Lista vehículos |
| POST | `/api/vehicles` | Crea un vehículo |
| GET | `/api/vehicles/{id}` | Consulta un vehículo por ID |
| GET | `/api/service-orders` | Lista órdenes de servicio |
| POST | `/api/service-orders` | Crea una orden de servicio |
| GET | `/api/service-orders/{id}` | Consulta una orden por ID |
| GET | `/api/service-orders/vehicle/{vehicleId}` | Consulta el historial del vehículo |
| GET | `/api/work-orders/vehicle/{vehicleId}` | Obtiene la orden de taller más reciente o crea una inicial |
| GET | `/api/work-orders/{id}` | Consulta una orden de taller por ID |
| PUT | `/api/work-orders/{id}` | Guarda diagnóstico, estado, tareas, repuestos y mano de obra |
| POST | `/api/vehicles/search` | Busca un vehículo por placa y documento |

## Rutas del frontend

La aplicación Angular define estas vistas principales en la configuración de rutas:

| Ruta | Descripción |
|---|---|
| `/vehicle-intake` | Pantalla de ingreso de vehículo y cliente para crear la recepción del taller |
| `/service-orders/:id/edit` | Edición de una orden de servicio existente |
| `/vehicles/:vehicleId/work-order` | Orden de trabajo del mecánico para un vehículo |
| `/vehicles` | Lista general de vehículos registrados |
| `/mechanic/vehicles` | Acceso alternativo al listado del mecánico |
| `/client/search` | Consulta de vehículo para el cliente |
| `/client/home` | Portal del cliente e historial de mantenimientos |
| `/` | Redirige al tablero (`/dashboard`) |
| `**` | Redirige a `/client/search` cuando la ruta no existe |

Estas rutas se configuran en `src/app/app.routes.ts`. Las vistas del mecánico comparten el layout principal; las rutas del portal cliente se muestran sin ese layout.

## Organización del frontend

El frontend usa componentes standalone cargados de forma diferida por el router. El punto de entrada `src/main.ts` arranca `AppComponent`, que muestra el `RouterOutlet`; `src/app/app.config.ts` registra el router y `HttpClient`.

| Área | Responsabilidad |
|---|---|
| `src/app/core` | Configuración HTTP, modelos compartidos y validación de placa |
| `src/app/layouts` | Estructura de navegación del mecánico |
| `src/app/features/dashboard` | Resumen de vehículos y contadores por estado |
| `src/app/features/vehicle-intake` | Crear y editar recepción, cliente, vehículo y evidencia |
| `src/app/features/vehicles` | Listado, búsqueda, filtros, paginación e inicio de acciones |
| `src/app/features/work-order` | Diagnóstico, tareas, repuestos, mano de obra y costos |
| `src/app/features/client` | Búsqueda de vehículo e historial para el cliente |

El tablero y el listado comparten `VehicleMechanicService`. El estado de la orden se conserva en `service_orders`; tareas, repuestos y mano de obra se guardan en sus tablas relacionadas. El historial del cliente presenta el costo final registrado como moneda COP.

La recepción de imágenes valida formato, tamaño y cantidad en el navegador, pero actualmente guarda solo nombres de archivo en la API: no sube el contenido binario de las imágenes.

## Ejemplo de estructura JSON para crear una orden

```json
{
  "entryDate": "2026-08-25",
  "primaryReason": "Mantenimiento preventivo",
  "currentMileage": 5000,
  "customerObservations": "Revisar frenos y aceite",
  "photoFront": "frente.jpg",
  "photoRightSide": "lado-derecho.jpg",
  "photoBack": "trasera.jpg",
  "photoOdometer": "odometro.jpg",
  "photoExtra": "extra.jpg",
  "vehicle": {
    "id": 6
  }
}
```

## Pruebas y validación

### Backend

```powershell
./gradlew test
```

### Frontend

```powershell
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

## Colección de Postman

La carpeta `backend/postman` incluye la colección `AutoLog.postman_collection.json`, útil para probar los endpoints en secuencia y automatizar la creación de cliente, vehículo y orden.

## Observaciones del proyecto

- El proyecto está orientado a una recepción de vehículos en taller.
- La lógica de negocio principal está enfocada en la captura de ingreso y la relación cliente-vehículo-orden.
- La interfaz está diseñada para una experiencia rápida de alta usabilidad en una operación de recepción.
