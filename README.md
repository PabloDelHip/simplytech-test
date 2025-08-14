# Proyecto API Simplytech - Eventos

Este proyecto es una API REST desarrollada con **Node.js** y **Express**, que utiliza **MongoDB** como base de datos y está completamente dockerizada para facilitar su despliegue.

## 📄 Variables de entorno

Antes de ejecutar el proyecto, es necesario crear un archivo .env en la raíz del proyecto.
Puedes tomar como referencia el archivo .env.example que ya está incluido en el repositorio:

```bash
MONGO_URI=
MONGO_DB_NAME=
PORT=
JWT_SECRET=
JWT_EXPIRES_IN=
```

## 🚀 Levantar el proyecto con Docker

Asegúrate de tener **Docker** y **Docker Compose** instalados en tu máquina.

```bash
# 1. Clonar el repositorio
git clone https://github.com/PabloDelHip/simplytech-test.git
cd simplytech-test

# 2. Crear el archivo .env basado en .env.example
cp .env.example .env
# Edita el archivo con tus valores

# 3. Levantar los contenedores
docker compose up --build
```

La API estará disponible en: **http://localhost:3000**  
La documentación Swagger estará en: **http://localhost:3000/docs**

## 🧪 Correr los tests

Antes de ejecutar las pruebas, instala las dependencias:
```bash
npm install
```
Ejecutar todos los tests una sola vez:
```bash
npm install
```
Ejecutar tests en modo observador (se vuelven a correr al detectar cambios):
```bash
npm run test:watch
```
## 📂 Estructura del proyecto

```
src/
  config/
    db/
      mongo.db.js           # conexión/cliente Mongo
    env.js                  # validación de variables con Joi
    logger.js               # logger (Winston)
  infra/
    db/
      base.repository.js    # clase base para repositorios (CRUD + helpers)
    docs/
      openapi.json          # especificación Swagger/OpenAPI
    swagger.js              # montaje de Swagger en /docs
  middlewares/
    auth.middleware.js      # autenticación JWT (+ bypass en tests)
  modules/
    auth/
      dto/
        index.js
      auth.controller.js
      auth.resource.js      # rutas de /auth
      auth.service.js
      index.js              # ensamblado del módulo
    events/
      ...                   # controller/service/repository/resource/dto del dominio "events"
    users/
      ...                   # controller/service/repository/resource/dto del dominio "users"
  routes/
    index.js                # registro central de recursos (módulos)
  support/
    helpers/
      jwt.helper.js         # firma/verificación de JWT
      parser.helper.js
      validate-dto.helper.js
    validators/
      objectid.validator.js
    index.js                # utilidades compartidas (RequestValidation, ObjectParser, etc.)
http-server.js              # servidor HTTP: middlewares, CORS, Helmet, RateLimit, logs, error handler
index.js                    # bootstrap de la app (connectMongo + levantar servidor)
test/
  e2e/
    events.test.js          # pruebas de flujo con Supertest
  module/
    events/
      events.services.test.js
```
## 🎯 Decisiones de arquitectura y patrones

- **SOLID**
  - *Single Responsibility*: cada clase (Controller/Service/Repository) tiene una responsabilidad concreta.
  - *Open/Closed*: repositorios y servicios admiten extensión sin modificar la base (`BaseRepository`).
  - *Dependency Inversion*: controladores dependen de abstracciones (servicios) y servicios de repositorios.

- **Patrón Repository**  
  Capa de acceso a datos desacoplada de Mongo (consultas y agregaciones están en `*.repository.js` heredando de `BaseRepository`).

- **Service Layer**  
  Reglas de negocio en `*.service.js` (validaciones de dominio, invariantes, composición de operaciones).

- **Inyección de dependencias (manual)**  
  Cada `resource` crea sus instancias `Repository -> Service -> Controller` y las “inyecta” explícitamente. Facilita testeo y reemplazo.

- **DTOs y validación**  
  Validaciones centralizadas (p. ej. `RequestValidation.fullValidate` y validadores de ObjectId); variables de entorno validadas con **Joi**.

- **Seguridad y hardening**
  - **Helmet** (cabeceras seguras)
  - **CORS** configurado
  - **express-mongo-sanitize** para prevenir NoSQL Injection
  - **Rate Limit** (p. ej. 100 req / 30s)
  - **JWT** en middleware (`auth.middleware.js`), con bypass para tests vía `SKIP_AUTH`

- **Observabilidad**  
  Logs uniformes con **Winston** (app) y **Morgan** (HTTP) enviados a `logger.http`; trazas por feature (Controller/Service/Repository).

- **Errores centralizados**  
  Handler unificado en `http-server.js` que responde con  
  `{ code, error, status, path, method, timestamp }`.
