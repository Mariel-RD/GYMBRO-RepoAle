# GYMBRO

Aplicacion web para el seguimiento de actividad fisica. Incluye dashboards, gestion de rutinas, progreso del cliente y autenticacion (registro/login) con backend en Node.js + Express + MongoDB.

Proyecto universitario para la materia Programacion Web II (UANL).

## Integrantes

- Alexia Mariel Rodriguez Degollado
- Carlos Daniel Martinez Muniz

## Estructura del proyecto

```text
GYMBRO/
	Assets/
	BackEnd/
		server.js
		package.json
		.env
	FrontEnd/
		css/
		html/
		js/
	package.json
	tools/
```

## Tecnologias

- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: Node.js, Express, Mongoose
- Base de datos: MongoDB
- Auth: bcryptjs + JWT

## Ejecucion completa

Desde la raiz del proyecto:

```bash
npm install
npm install --prefix BackEnd
npm start
```

Esto levanta la API en `http://localhost:5000` y el frontend en:

```text
http://localhost:3000/FrontEnd/html/GYMBRO.html
```

## Backend: configuracion rapida

1. Ir a la carpeta backend:

```bash
cd BackEnd
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno en `BackEnd/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/gymbro
JWT_SECRET=REEMPLAZA
```

4. Levantar servidor:

```bash
npm start
```

Si todo sale bien, veras mensajes como:

- MongoDB conectado
- Servidor GYMBRO corriendo en puerto 5000

## Endpoints principales

Base URL local:

```text
http://localhost:5000
```

### Healthcheck

- Metodo: `GET`
- Ruta: `/api/`

### Registro

- Metodo: `POST`
- Ruta: `/api/register`
- Headers: `Content-Type: application/json`

Body recomendado:

```json
{
	"nombre": "Alex",
	"apellido": "Lopez",
	"email": "alex.lopez@correo.com",
	"password": "1234",
	"rol": "cliente"
}
```

### Login

- Metodo: `POST`
- Ruta: `/api/login`
- Headers: `Content-Type: application/json`

Body de ejemplo:

```json
{
	"email": "alex.lopez@correo.com",
	"password": "1234"
}
```

### Otros modulos disponibles

- Usuarios y perfil: `/api/coaches`, `/api/perfil/:id`
- Relacion coach-cliente: `/api/coach-cliente`
- Resenas de coach: `/api/resenas-coach`
- Ejercicios: `/api/ejercicios`
- Rutinas: `/api/rutinas`
- Asignacion de rutinas: `/api/asignacion-rutinas`
- Progreso de clientes: `/api/progresos`

## Frontend

Los archivos HTML estan en `FrontEnd/html/`. Puedes abrirlos directamente en el navegador o servirlos con una extension/live server.

Pantallas principales:

- `GYMBRO.html`
- `login.html`
- `registro.html`
- `dashboard-cliente.html`
- `dashboard-coach.html`
- `perfil-cliente.html` y `perfil-coach.html`
- `mi-coach.html`
- `rutina-cliente.html` y `progreso-cliente.html`
- `CrearRutina-coach.html` y `GestionRutina-coach.html`

## Seguridad basica

- Mantener `BackEnd/.env` fuera del repositorio.

