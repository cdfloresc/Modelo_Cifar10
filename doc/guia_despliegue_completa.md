# 📋 Guía Completa de Despliegue — NetClasify CIFAR-10

**Autor:** Cristian Darwin Flores Cueva  
**Fecha:** Junio 2026

---

## 📌 Resumen del Flujo

```
┌─────────────────┐        HTTPS        ┌──────────────────┐
│   APK / Móvil   │ ──────────────────► │   Backend en     │
│   (Capacitor)   │ ◄────────────────── │   Render.com     │
└─────────────────┘     JSON Response    └──────────────────┘
                                              │
                                         modelo.keras
                                         (cargado en RAM)
```

**Orden correcto:**
1. ✅ Primero: Subir el **Backend** a Render → Obtener URL
2. ✅ Segundo: Poner la URL en el Frontend → Compilar APK

---

## PARTE 1: Subir el Backend a Render

### Paso 1.1 — Crear un nuevo repositorio SOLO para el backend

Render necesita un repositorio donde el `Dockerfile` esté en la raíz. La forma más limpia es crear un repo separado solo para el backend.

**Opción A: Repo separado (RECOMENDADO)**

```bash
# 1. Crea una carpeta temporal en tu escritorio
mkdir C:\Users\CATO\Desktop\cifar10-backend
cd C:\Users\CATO\Desktop\cifar10-backend

# 2. Copia los archivos del backend
xcopy /E /I "d:\Universidad\Ing. Sistemas\9no Semestre\APRENDIZAJE PROFUNDO\Trabajo Unidad 1\backend\*" .

# IMPORTANTE: Borra la carpeta .venv (no se sube a GitHub)
rmdir /S /Q .venv
rmdir /S /Q app\__pycache__

# 3. Verifica la estructura — debe verse así:
#    cifar10-backend/
#    ├── Dockerfile          ← EN LA RAÍZ
#    ├── requirements.txt
#    └── app/
#        ├── __init__.py
#        ├── main.py
#        ├── model_loader.py
#        ├── schemas.py
#        └── modelo_final_cifar10.keras (37 MB)

# 4. Inicializa Git y sube a GitHub
git init
git add -A
git commit -m "v1: Backend CIFAR-10 para Render"
git branch -M main

# 5. Crea un nuevo repo en GitHub llamado "cifar10-backend" y conecta:
git remote add origin https://github.com/cdfloresc/cifar10-backend.git
git push -u origin main
```

**Opción B: Usar el monorepo actual (alternativa)**

Si prefieres no crear otro repo, en Render puedes configurar el **Root Directory** como `backend` al crear el servicio. Pero debes verificar que Render detecte el `Dockerfile` dentro de esa carpeta.

### Paso 1.2 — Crear el Web Service en Render

1. Ve a **[https://dashboard.render.com](https://dashboard.render.com)**
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu cuenta de GitHub y selecciona el repositorio:
   - Si usaste Opción A: selecciona `cifar10-backend`
   - Si usaste Opción B: selecciona `Modelo_Cifar10` y pon **Root Directory**: `backend`
4. Configura:

| Campo | Valor |
|---|---|
| **Name** | `cifar10-backend` (o el que quieras) |
| **Region** | Oregon (US West) o el más cercano |
| **Branch** | `main` |
| **Runtime** | Docker |
| **Instance Type** | Free (suficiente para demo) |

5. Haz clic en **"Create Web Service"**

### Paso 1.3 — Esperar el Deploy

- Render detectará el `Dockerfile`, construirá la imagen y desplegará.
- **⚠️ La primera vez tarda ~10-15 minutos** porque instala TensorFlow (~500MB).
- Cuando termine, verás un estado **"Live"** y una URL como:
  ```
  https://cifar10-backend.onrender.com
  ```

### Paso 1.4 — Verificar que funciona

Abre estas URLs en tu navegador:

```
https://TU-URL.onrender.com/
→ Debe responder: {"message": "Welcome to the CIFAR-10 Image Recognition API", "status": "online"}

https://TU-URL.onrender.com/health
→ Debe responder: {"status": "healthy", "model_loaded": true}
```

> **⚠️ NOTA sobre el plan Free de Render:** El servicio se "duerme" después de 15 minutos sin tráfico. La primera petición después de dormirse tarda ~2-3 minutos en despertar. Esto es normal.

---

## PARTE 2: Configurar el Frontend con la URL del Backend

### Paso 2.1 — Actualizar la variable de entorno

Una vez tengas la URL de Render, edita el archivo:

📄 **`frontend/.env.production`**
```env
VITE_API_URL=https://cifar10-backend.onrender.com
```

> Reemplaza `cifar10-backend` con el nombre real que Render te asignó.

### Paso 2.2 — Reconstruir y sincronizar

```bash
cd "d:\Universidad\Ing. Sistemas\9no Semestre\APRENDIZAJE PROFUNDO\Trabajo Unidad 1\frontend"

# Build de producción (usa .env.production)
npm run build

# Sincroniza con el proyecto Android
npx cap sync android
```

### Paso 2.3 — Commit y push

```bash
cd "d:\Universidad\Ing. Sistemas\9no Semestre\APRENDIZAJE PROFUNDO\Trabajo Unidad 1"
git add -A
git commit -m "v3: feat: conectar frontend a backend en Render"
git push origin main
```

---

## PARTE 3: Generar el APK

### Pre-requisito: Instalar Android Studio

1. Descarga: **[https://developer.android.com/studio](https://developer.android.com/studio)**
2. Instala y abre Android Studio
3. Ve a **SDK Manager** → instala **Android SDK 33 o 34**
4. Acepta las licencias

### Paso 3.1 — Abrir el proyecto en Android Studio

```bash
cd "d:\Universidad\Ing. Sistemas\9no Semestre\APRENDIZAJE PROFUNDO\Trabajo Unidad 1\frontend"
npx cap open android
```

Esto abrirá Android Studio con el proyecto. **Espera a que termine la sincronización de Gradle** (la primera vez tarda varios minutos, se ve en la barra inferior).

### Paso 3.2 — Generar el APK

1. En Android Studio: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Espera la compilación (~2-3 minutos la primera vez)
3. Cuando termine, aparece una notificación **"APK(s) generated successfully"** con un link **"locate"**
4. El APK estará en:

```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Paso 3.3 — Instalar en tu teléfono

- **Opción 1:** Conecta tu Android por USB → Android Studio → botón ▶️ Run
- **Opción 2:** Copia `app-debug.apk` a tu teléfono → Ábrelo → Instalar
  - Debes activar "Instalar desde fuentes desconocidas" en ajustes

---

## PARTE 4: ¿Funciona el APK sin cambiar nada?

### Respuesta corta: **SÍ, funciona**, pero con matices:

| Escenario | ¿Funciona? | Detalle |
|---|---|---|
| **Sin backend desplegado** | ✅ Parcial | La app abre, puedes subir fotos, tomar fotos con la cámara nativa. Las predicciones usan el **modo simulado** (genera resultados aleatorios porque no puede conectar a localhost desde el teléfono) |
| **Con backend en Render** | ✅ Completo | Predicciones reales con el modelo EfficientNetB0. Solo necesitas poner la URL en `.env.production` y recompilar |

### ¿Qué muestra el APK actual (sin backend)?

- ✅ Interfaz completa funcionando
- ✅ Cámara nativa del teléfono (usa `@capacitor/camera`)
- ✅ Galería para subir imágenes
- ✅ Banco de pruebas con las 4 imágenes de ejemplo
- ✅ Modo oscuro/claro
- ✅ Preguntas de la rúbrica
- ⚠️ Las predicciones serán **simuladas** (no reales) — el indicador mostrará "simulado" en la barra de estado

### Para que funcione al 100% con predicciones reales:

```
1. Sube backend a Render → obtienes URL
2. Edita frontend/.env.production → VITE_API_URL=https://tu-url.onrender.com
3. npm run build && npx cap sync android
4. Recompila APK en Android Studio
5. Instala en el teléfono → ¡Listo! 🎉
```

---

## Resumen de Comandos Rápidos

```bash
# === BACKEND (una sola vez) ===
# Crea repo separado y sube a GitHub → Conecta a Render como Docker

# === FRONTEND: Actualizar URL y recompilar ===
cd frontend
# Edita .env.production con la URL de Render
npm run build
npx cap sync android
npx cap open android
# En Android Studio: Build → Build APK(s)

# === COMMIT ===
cd ..
git add -A
git commit -m "v3: conectar a backend Render"
git push origin main
```
