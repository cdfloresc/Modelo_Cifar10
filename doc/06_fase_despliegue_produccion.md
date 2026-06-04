# Fase 6: Despliegue en Producción y Variables de Entorno

Este documento describe la preparación para producción de la aplicación de reconocimiento de imágenes (CIFAR-10), incluyendo la configuración del backend para entornos en la nube y la parametrización de variables de entorno en el frontend para compilar a PWA o generar el APK híbrido con Capacitor.

---

## 1. Cambios en el Backend (FastAPI)

Para permitir que el servidor funcione dinámicamente en servicios de hosting cloud como **Render**, se implementaron dos cambios clave en [main.py](file:///d:/Universidad/Ing.%2520Sistemas/9no%2520Semestre/APRENDIZAJE%2520PROFUNDO/Trabajo%2520Unidad%25201/backend/app/main.py):

### Puerto y Host Dinámicos
Se agregó un bloque de ejecución directa en la raíz del script principal:
```python
if __name__ == "__main__":
    import uvicorn
    import os
    host = "0.0.0.0"
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
```
Esto le permite a Render (o cualquier orquestador) inyectar dinámicamente el puerto asignado a través de la variable de entorno global `PORT`, abriendo la interfaz del host a todas las IPs (`0.0.0.0`) requerida por los proxies inversos de producción.

### CORS Flexibles para Capacitor y PWA
El origen fijo local del Vite dev server se amplió a un comodín (`"*"`) para aceptar peticiones provenientes de cualquier dominio de producción y de los esquemas locales que usan las aplicaciones móviles compiladas con Capacitor:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Requerido obligatoriamente en False al usar origen comodín "*"
    allow_methods=["*"],
    allow_headers=["*"],
)
```
> [!IMPORTANT]
> Al configurar orígenes comodín (`"*"`), FastAPI/Starlette exige desactivar `allow_credentials` para evitar vulnerabilidades de seguridad CSRF. Como nuestro backend de inferencia no requiere de cookies o credenciales de sesión HTTP nativas, este cambio es completamente seguro y compatible.

---

## 2. Configuración de Variables de Entorno en el Frontend

Vite utiliza las variables prefijadas con `VITE_` para cargarlas estáticamente en tiempo de compilación. Hemos establecido dos archivos en la raíz del subdirectorio `/frontend`:

1. **Desarrollo Local (`/frontend/.env`):**
   ```env
   VITE_API_URL=http://localhost:8000
   ```
2. **Producción (`/frontend/.env.production`):**
   ```env
   VITE_API_URL=TU_URL_DE_RENDER_AQUI
   ```

### Refactorización en React
Las consultas en el archivo principal [App.tsx](file:///d:/Universidad/Ing.%2520Sistemas/9no%2520Semestre/APRENDIZAJE%2520PROFUNDO/Trabajo%2520Unidad%25201/frontend/src/App.tsx) se parametrizaron para usar esta variable:
```typescript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
fetch(`${apiUrl}/health`)
```
Y para el endpoint de predicción:
```typescript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
fetch(`${apiUrl}/api/predict`, { ... })
```

---

## 3. Preparación antes de construir el APK (Capacitor)

Cuando decidas empaquetar el frontend a una app móvil nativa usando Capacitor, debes asegurarte de que el build estático apunte a tu backend de producción:

1. Modifica la variable `VITE_API_URL` en el archivo [frontend/.env.production](file:///d:/Universidad/Ing.%2520Sistemas/9no%2520Semestre/APRENDIZAJE%2520PROFUNDO/Trabajo%2520Unidad%25201/frontend/.env.production) reemplazando `TU_URL_DE_RENDER_AQUI` por la URL pública HTTPS de tu servicio FastAPI web en Render (por ejemplo, `https://mi-api-cifar10.onrender.com`).
2. Genera el build de producción del frontend:
   ```bash
   npm run build:frontend
   ```
   *Vite compilará los assets optimizados en la carpeta `/frontend/dist` inyectando tu URL de Render pública.*
3. Sincroniza la carpeta web compilada con tus entornos móviles nativos en Capacitor:
   ```bash
   npx cap sync
   ```
4. Procede a compilar el APK en Android Studio o Xcode normalmente.

---

## 4. Guía de Despliegue del Backend en Render

Sigue estos pasos para alojar tu backend de inferencia Keras en **Render**:

### Paso 1: Crear un nuevo Web Service
1. Inicia sesión en tu cuenta de [Render Dashboard](https://dashboard.render.com/).
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio Git (donde subas el monorepo).

### Paso 2: Configuración del Repositorio y Carpetas
Dado que nuestro proyecto es un monorepo, configura los siguientes parámetros en el formulario de Render:
* **Name:** `cifar10-inference-api` (o el nombre que prefieras).
* **Region:** Selecciona la más cercana (ej. `Ohio (us-east-2)` o `Oregon (us-west-2)`).
* **Runtime:** `Python 3` (Render detectará automáticamente las dependencias).
* **Root Directory:** `backend` *(Esto le indica a Render que trabaje sobre la subcarpeta `/backend` ignorando la de React).*

### Paso 3: Comandos de Construcción e Inicio
* **Build Command:**
  ```bash
  pip install --upgrade pip && pip install -r requirements.txt
  ```
* **Start Command:**
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
  *(O ejecuta directamente `python app/main.py` ya que configuramos la lectura de puertos dinámicos).*

### Paso 4: Ajustar los límites de memoria (Plan Gratuito / Free Tier)
> [!WARNING]
> La carga en memoria de TensorFlow/Keras y las librerías NumPy/Pillow requiere un promedio de **500MB a 800MB** de memoria RAM. El plan gratuito de Render ofrece 512MB, lo cual puede ocasionar errores de falta de memoria (Out-of-Memory / OOM).
> 
> **Recomendación:** Si despliegas en el Free Tier, asegúrate de utilizar librerías ligeras o habilitar la variable de entorno `TENSORFLOW_CPU_MEM_USAGE=light` si tu entorno lo permite. Si el servidor experimenta reinicios constantes en Render, te recomendamos escalar al plan **Starter** (que ofrece 1GB o 2GB de RAM) para asegurar inferencias fluidas y carga estable del modelo en memoria.
