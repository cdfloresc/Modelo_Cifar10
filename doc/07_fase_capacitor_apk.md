# FASE 7 — Empaquetado Móvil con Capacitor y Preparación del APK

**Proyecto:** NetClasify — Clasificador CIFAR-10  
**Autor:** Cristian Darwin Flores Cueva  
**Fecha:** Junio 2026

---

## 1. Resumen de Cambios Realizados

En esta fase, el frontend web (Vite + React + TailwindCSS) fue transformado en una aplicación nativa de Android utilizando **Capacitor**, el sucesor de Cordova del equipo de Ionic.

### Paquetes Instalados

| Paquete | Tipo | Versión | Propósito |
|---|---|---|---|
| `@capacitor/core` | Dependencia | ^6.x | Runtime bridge entre web y nativo |
| `@capacitor/cli` | Dev dependency | ^6.x | CLI para init, build, sync, open |
| `@capacitor/android` | Dependencia | ^6.x | Plataforma Android nativa |
| `@capacitor/camera` | Dependencia | ^8.x | Plugin nativo para cámara y galería |
| `@capacitor/preferences` | Dependencia | ^8.x | Plugin nativo para almacenamiento local |

### Archivos Creados / Modificados

| Archivo | Acción | Descripción |
|---|---|---|
| `frontend/capacitor.config.ts` | Creado | Configuración de Capacitor: appId, appName, webDir, HTTPS scheme |
| `frontend/android/` | Generado | Proyecto Android nativo completo (Gradle, Manifest, etc.) |
| `frontend/src/utils/capacitorCamera.ts` | Creado | Helper que abstrae `@capacitor/camera` con detección de plataforma |
| `frontend/src/components/ImageUploader.tsx` | Modificado | Integra el plugin nativo en Capacitor, mantiene fallback web |
| `frontend/android/.../AndroidManifest.xml` | Modificado | Permisos: CAMERA, STORAGE, READ_MEDIA_IMAGES |
| `frontend/.gitignore` | Modificado | Excluye artefactos de build de Gradle |

---

## 2. Adaptación de la Cámara para Capacitor

### Estrategia: Detección de Plataforma en Runtime

El componente `ImageUploader` ahora usa un patrón **platform-aware** (consciente de la plataforma):

```typescript
import { Capacitor } from '@capacitor/core'

// Detecta si la app corre dentro de un APK nativo
if (Capacitor.isNativePlatform()) {
  // Usa @capacitor/camera → Abre la cámara nativa del sistema operativo
  const photo = await Camera.getPhoto({ ... })
} else {
  // Fallback web → Usa navigator.mediaDevices.getUserMedia()
  // (El componente CameraUploader existente)
}
```

### Flujo en Nativo (APK)

1. El usuario toca **"Tomar Foto"** → Se invoca `Camera.getPhoto()` con `source: CameraSource.Camera`
2. Android abre la app de cámara nativa del dispositivo
3. El usuario captura la foto → Se devuelve como Data URL (base64)
4. Se pasa al flujo de inferencia existente

### Flujo en Web (Navegador)

1. El usuario toca **"Tomar Foto"** → Se abre el overlay `CameraUploader`
2. Usa `navigator.mediaDevices.getUserMedia()` para stream de video
3. El usuario captura manualmente → Canvas genera Data URL
4. Se pasa al flujo de inferencia existente

---

## 3. Permisos de Android

Los siguientes permisos fueron agregados en `AndroidManifest.xml`:

```xml
<!-- Camera Permissions (required by @capacitor/camera plugin) -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<!-- Android 13+ (API 33) scoped storage -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

> **Nota:** Los permisos de `INTERNET` ya estaban incluidos por defecto.

---

## 4. Guía para Generar el APK

### Pre-requisitos

- **Android Studio** instalado (con SDK Manager y al menos Android SDK 33+)
- **Java JDK 17+** instalado y en el `PATH`
- **Gradle** (se usa el wrapper incluido en el proyecto)

### Método A: Desde Android Studio (Recomendado)

1. **Abre el proyecto Android:**
   ```bash
   cd frontend
   npx cap open android
   ```
   Esto abrirá Android Studio con el proyecto listo.

2. **Espera la sincronización de Gradle** (primera vez tarda varios minutos).

3. **Genera el APK Debug:**
   - Menú: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - El APK se genera en:
     ```
     frontend/android/app/build/outputs/apk/debug/app-debug.apk
     ```

4. **Instala en tu dispositivo:**
   - Conecta tu Android por USB con Depuración USB activada
   - Haz clic en el botón ▶️ (Run) de Android Studio
   - O transfiere el `.apk` manualmente al teléfono

### Método B: Desde la Terminal (Sin Android Studio)

```bash
# 1. Navega a la carpeta android del frontend
cd frontend/android

# 2. Genera el APK de Debug con Gradle
./gradlew assembleDebug

# En Windows usa:
gradlew.bat assembleDebug

# 3. El APK estará en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Para APK de Release (Producción)

```bash
# 1. Genera un keystore (solo la primera vez)
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# 2. Configura la firma en android/app/build.gradle
# (agregar bloque signingConfigs)

# 3. Genera el APK firmado
cd frontend/android
./gradlew assembleRelease
```

---

## 5. Flujo Completo de Actualización (Cuando Tengas la URL de Render)

Cuando despliegues el backend en Render y obtengas la URL (ej. `https://modelo-cifar10.onrender.com`), sigue estos pasos para actualizar el APK:

### Paso 1: Actualiza la variable de entorno de producción

Edita el archivo `frontend/.env.production`:
```env
VITE_API_URL=https://tu-url-real-de-render.onrender.com
```

### Paso 2: Reconstruye el frontend

```bash
cd frontend
npm run build
```

### Paso 3: Sincroniza con Android

```bash
npx cap sync android
```

### Paso 4: Genera el APK final

```bash
# Desde Android Studio:
npx cap open android
# Build → Build APK(s)

# O desde terminal:
cd android
gradlew.bat assembleDebug
```

### Resumen del flujo en un solo comando:

```bash
cd frontend && npm run build && npx cap sync android && cd android && gradlew.bat assembleDebug
```

---

## 6. Estructura de Archivos Resultante

```
frontend/
├── android/                          ← Proyecto Android nativo (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   ← Permisos: CAMERA, STORAGE, INTERNET
│   │   │   ├── assets/public/        ← Web assets copiados por `cap sync`
│   │   │   └── java/.../MainActivity.java
│   │   └── build.gradle
│   ├── build.gradle
│   ├── gradle/
│   ├── gradlew / gradlew.bat
│   └── settings.gradle
├── capacitor.config.ts               ← Configuración de Capacitor
├── src/
│   ├── utils/
│   │   └── capacitorCamera.ts        ← Helper nativo con detección de plataforma
│   ├── components/
│   │   ├── ImageUploader.tsx          ← Integra plugin nativo + fallback web
│   │   ├── CameraUploader.tsx         ← Fallback web (mediaDevices)
│   │   └── ResultCard.tsx
│   └── App.tsx
├── package.json
└── .env / .env.production
```

---

## 7. Troubleshooting

| Problema | Solución |
|---|---|
| `Camera.getPhoto()` falla | Verifica permisos en `AndroidManifest.xml` y que el dispositivo tenga cámara |
| APK no conecta al backend | Verifica que `VITE_API_URL` en `.env.production` apunte a la URL de Render correcta |
| Gradle no encuentra SDK | Instala Android SDK 33+ desde Android Studio → SDK Manager |
| Pantalla en blanco en el APK | Ejecuta `npm run build && npx cap sync android` antes de compilar |
| CORS error desde el APK | Verifica que el backend tenga `allow_origins=["*"]` |
