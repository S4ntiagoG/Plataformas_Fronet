# AutoLog Backend

API REST para clientes, vehículos, órdenes de servicio e historial de mantenimientos.

## Arquitectura

El backend está organizado en capas:

- `controller`: endpoints HTTP bajo `/api`.
- `service`: reglas de reutilización, validación y consultas.
- `repository`: interfaces Spring Data JPA.
- `model`: entidades `Client`, `Vehicle`, `ServiceOrder`, `Admin` y `Mecanico`.
- `dto`: respuestas y solicitudes específicas del portal cliente.

La relación principal es `Client 1:N Vehicle 1:N ServiceOrder`.

## Requisitos

- Java 25.
- Docker Desktop.
- Postman opcional.

## Ejecución local

### 1. Levantar PostgreSQL

Desde la carpeta raiz del proyecto:

```powershell
docker compose up -d
```

La base de datos queda disponible en `localhost:5432` con estos datos:

- Base de datos: `autolog_db`
- Usuario: `autolog`
- Contrasena: `autolog1234`

### 2. Configurar autenticación

El taller requiere una cuenta `Admin` o `Mecanico`. Para crear un administrador inicial cuando aún no exista, configura estas variables en la misma terminal desde la que iniciarás Spring Boot:

```powershell
$env:AUTOLOG_AUTH_USERNAME = Read-Host "Usuario administrador"
$env:AUTOLOG_AUTH_PASSWORD = Read-Host "Contrasena administrador"
$secretBytes = New-Object byte[] 32
$random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$random.GetBytes($secretBytes)
$env:AUTOLOG_JWT_SECRET = [Convert]::ToBase64String($secretBytes)
$random.Dispose()
```

Guarda `AUTOLOG_JWT_SECRET` en el entorno local para conservar la validez de los tokens al reiniciar el backend. La cuenta se crea solo si el usuario todavía no existe; las contraseñas legadas de administradores y mecánicos se convierten a BCrypt al iniciar.

Para provisionar mecánicos de demostración, configura `AUTOLOG_DEMO_MECHANICS` como un arreglo JSON de objetos con `codigoMecanico`, `nombre` y `password`. Al iniciar, se insertan los códigos que no existan y se almacenan las contraseñas con BCrypt; las cuentas existentes no se sobrescriben. No guardes esta variable en el repositorio.

Inicia sesión con `POST /api/auth/login` y envía el token como `Authorization: Bearer <accessToken>` en las rutas del taller. El login, la búsqueda pública `POST /api/vehicles/search` y el historial público del portal quedan disponibles sin token.

### 3. Ejecutar el backend

En otra terminal, desde la misma carpeta:

```powershell
./gradlew bootRun
```

En Windows tambien puede ejecutarse:

```powershell
.\gradlew.bat bootRun
```

La API queda disponible en:

```text
http://localhost:8080
```

### 4. Probar con Postman

Importar el archivo `postman/AutoLog.postman_collection.json` en Postman.
En el entorno activo, crea `authUsername` y `authPassword` con las credenciales del administrador o mecánico.

Ejecutar las solicitudes en este orden:

1. `POST - Iniciar sesion`
2. `POST - Crear cliente`
3. `GET - Listar clientes`
4. `GET - Buscar cliente creado`
5. `POST - Crear vehiculo`
6. `GET - Listar vehiculos`
7. `GET - Buscar vehiculo creado`
8. `POST - Crear orden de servicio`
9. `GET - Listar ordenes`
10. `GET - Buscar orden creada`

La coleccion guarda automaticamente los IDs creados en las variables `clientId`, `vehicleId` y `serviceOrderId`. Por eso no es necesario escribir IDs manualmente.

## Requests manuales

En todos los `POST`, seleccionar `Body > raw > JSON` y agregar el header `Content-Type: application/json`.

### Iniciar sesión

```text
POST http://localhost:8080/api/auth/login
```

```json
{
	"username": "<usuario-admin-o-codigo-mecanico>",
	"password": "<contrasena>"
}
```

Usa `accessToken` de la respuesta como Bearer token para las operaciones protegidas.

### Crear cliente

```text
POST http://localhost:8080/api/clients
```

```json
{
	"name": "Ana Torres",
	"identificationNumber": "1098765432",
	"email": "ana.torres@email.com",
	"phone": "3001234567"
}
```

Respuesta esperada: `201 Created`. Si el correo o el documento ya pertenecen a un cliente, la API devuelve ese cliente con su ID existente en lugar de crear otro. Copiar el `id` de la respuesta para usarlo como `client.id` al crear el vehiculo.

### Consultar clientes

```text
GET http://localhost:8080/api/clients
GET http://localhost:8080/api/clients/{clientId}
```

Los `GET` no llevan body ni JSON.

### Crear vehiculo

Reemplazar `1` por un `client.id` que exista.

```text
POST http://localhost:8080/api/vehicles
```

```json
{
	"vehicleType": "Motocicleta",
	"brand": "Yamaha",
	"model": "FZ 2.0",
	"plate": "XYZ789",
	"chassisNumber": "VIN-XYZ-789",
	"vehicleYear": 2024,
	"client": {
		"id": 1
	}
}
```

Respuesta esperada: `201 Created`. Si la placa o el VIN ya pertenecen a un vehiculo asociado al mismo cliente, la API devuelve ese vehiculo con su ID existente. Copiar el `id` de la respuesta para usarlo como `vehicle.id` al crear una nueva orden.

### Consultar vehiculos

```text
GET http://localhost:8080/api/vehicles
GET http://localhost:8080/api/vehicles/{vehicleId}
```

### Crear orden de servicio

Reemplazar `6` por un `vehicle.id` que exista.

```text
POST http://localhost:8080/api/service-orders
```

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

Respuesta esperada: `201 Created`. La fecha debe usar el formato `YYYY-MM-DD` y `vehicle.id` debe existir.

### Consultar ordenes

```text
GET http://localhost:8080/api/service-orders
GET http://localhost:8080/api/service-orders/{serviceOrderId}
```

### Consultar historial de un vehículo

```text
GET http://localhost:8080/api/service-orders/vehicle/{vehicleId}
```

La respuesta contiene las órdenes del vehículo ordenadas de forma descendente por fecha e ID:

```json
[
	{
		"serviceOrderId": 12,
		"entryDate": "2026-08-25",
		"primaryReason": "Mantenimiento preventivo",
		"currentMileage": 5000,
		"customerObservations": "Revisar frenos y aceite",
		"serviceCost": null
	}
]
```

## Endpoints

| Metodo | Ruta | Resultado esperado |
|---|---|---|
| POST | `/api/auth/login` | JWT Bearer; `401 Unauthorized` con credenciales inválidas |
| GET | `/api/clients` | Lista de clientes |
| POST | `/api/clients` | `201 Created`; crea o reutiliza por correo/documento |
| GET | `/api/clients/{id}` | Cliente por ID |
| PUT | `/api/clients/{id}` | Actualiza un cliente |
| DELETE | `/api/clients/{id}` | Elimina un cliente |
| GET | `/api/vehicles` | Lista de vehiculos |
| POST | `/api/vehicles` | `201 Created`; crea o reutiliza por placa/VIN para el mismo cliente |
| GET | `/api/vehicles/{id}` | Vehiculo por ID |
| PUT | `/api/vehicles/{id}` | Actualiza un vehiculo |
| DELETE | `/api/vehicles/{id}` | Elimina un vehiculo |
| GET | `/api/service-orders` | Lista de ordenes |
| POST | `/api/service-orders` | `201 Created` |
| GET | `/api/service-orders/{id}` | Orden por ID |
| GET | `/api/service-orders/vehicle/{vehicleId}` | Historial del vehículo |
| PUT | `/api/service-orders/{id}` | Actualiza datos de la orden |
| DELETE | `/api/service-orders/{id}` | Elimina la orden |
| POST | `/api/vehicles/search` | Busca vehículo por placa y documento |

## Datos importantes

- Todos los requests con body deben usar `Content-Type: application/json`.
- El ingreso busca primero al cliente por correo o documento; solo crea uno si no encuentra coincidencias.
- Luego busca el vehiculo por placa o VIN y lo reutiliza si ya esta asociado al mismo cliente; solo crea uno si no encuentra coincidencias.
- Cada ingreso crea una nueva orden asociada al ID del vehiculo devuelto, incluso cuando se reutilizan cliente y vehiculo.
- El vehiculo necesita un cliente existente.
- La orden necesita un vehiculo existente dentro de `vehicle.id`.
- `entryDate` usa el formato `YYYY-MM-DD`.
- `serviceCost` existe como total persistido del mantenimiento, pero no se captura en el formulario de intake.
- El total futuro combinará mano de obra por motivo de visita e ítems del módulo de inventario.
- El detalle de factura y la asignación de mecánicos todavía no forman parte de la API.
- La API responde `409 Conflict` si el correo y el documento apuntan a clientes diferentes, si la placa y el VIN apuntan a vehiculos diferentes, o si el vehiculo encontrado pertenece a otro cliente.

## Ejecutar pruebas automatizadas

```powershell
./gradlew test
```
