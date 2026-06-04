# Arquitectura del Frontend y Diseño UI/UX

Este documento detalla el diseño de la interfaz de usuario, la jerarquía de los componentes en React y la integración técnica para el acceso a la cámara nativa en dispositivos móviles.

---

## 1. Jerarquía de Componentes React

La interfaz del frontend está estructurada de forma modular bajo una jerarquía jerárquica clara para mantener el desacoplamiento de la lógica:

```text
App (Layout principal, Gestor de Estado Global, Navegación e Inferencia)
├── Header (Marca del sistema y Selector de Modo Oscuro)
├── ImageUploader (Contenedor de acciones de entrada de imagen)
│   ├── Input (Oculto, selector de archivos del sistema / galería)
│   └── CameraUploader (Modal de captura de video y canvas)
├── SkeletonLoader / Spinner (Visualización de carga activa durante inferencia)
├── ResultsDashboard (Indicadores de clase predicha y gráfico de probabilidades)
├── QuestionList (Acordeón con el cuestionario técnico de la rúbrica)
└── Footer (Fijado al inferior con créditos de propiedad intelectual obligatorios)
```

### Descripción de Componentes Clave:
* **`App.tsx`:** Actúa como el orquestador principal. Mantiene el estado de la imagen activa, el control de la pestaña seleccionada, el estado de carga (`isAnalyzing`), el historial y las llamadas HTTP hacia la API de FastAPI.
* **`ImageUploader.tsx`:** Provee un selector de dos vías ("Subir de Galería" y "Tomar Foto"), gestionando la apertura del flujo de la cámara o la apertura del buscador de archivos del sistema operativo de manera unificada.
* **`CameraUploader.tsx`:** Módulo autónomo que encapsula la transmisión en tiempo real de la cámara y congela los cuadros de video para generar archivos listos para predicción.

---

## 2. Acceso a la Cámara y Compatibilidad Móvil

Para asegurar un rendimiento óptimo en dispositivos móviles Android (Chrome) e iOS (Safari) sin elevar el peso del bundle con librerías externas que suelen fallar al empaquetarse con Capacitor, se implementó una integración directa utilizando la API nativa **HTML5 MediaDevices**.

### Detalles Técnicos de Implementación:
1. **Detección de Cámara Trasera por Defecto:**
   Se utiliza la restricción `facingMode: "environment"` para indicarle al navegador móvil que priorice la cámara trasera (ideal para apuntar y capturar objetos). Si el dispositivo no posee cámara trasera (como en laptops sin webcam secundaria), el código captura automáticamente el error `NotFoundError` y conmuta al modo `facingMode: "user"` (cámara frontal/webcam) de manera fluida.
2. **Ciclo de Vida del Stream y Liberación de Recursos:**
   Para prevenir que la luz física de la cámara permanezca encendida tras cerrar el componente, se implementó una función de limpieza (`stopCamera`) que detiene explícitamente todos los tracks activos de la transmisión (`track.stop()`). Esta función se ejecuta automáticamente en el retorno del hook `useEffect` al desmontarse el componente.
3. **Captura y Recorte Cuadrado (Aspect Ratio 1:1):**
   Para optimizar la visualización de la imagen en un contenedor móvil nativo, el video se renderiza con `object-cover`. Al capturar, el flujo se dibuja en un elemento `<canvas>` que calcula las dimensiones mínimas (`Math.min(videoWidth, videoHeight)`) y recorta el centro de la imagen para producir una imagen perfectamente cuadrada, reduciendo el ruido visual en los bordes.
4. **Conversión Base64 a Binario (File):**
   La captura de la cámara produce una cadena Base64 (`data:image/jpeg;base64,...`). Dado que la API de FastAPI espera un archivo en un formulario binario (`multipart/form-data`), se implementó la función auxiliar `dataURLtoFile` que decodifica los caracteres Base64 en bytes binarios (`Uint8Array`) y genera un objeto `File` sintáctico.

---

## 3. Decisiones de Diseño UI/UX en Tailwind CSS

El diseño adopta una estética moderna orientada estrictamente al ecosistema móvil nativo utilizando Tailwind CSS v4:

### A. Paleta de Colores y Contraste (Modo Oscuro)
* **Fondo del Sistema:** Se emplean tonos profundos (`bg-slate-900` y `bg-slate-950`) para dar profundidad visual y reducir la fatiga ocular.
* **Acentos e Interacción:** Se definieron gradientes vibrantes y bordes difusos en color violeta/índigo (`from-violet-600 to-indigo-600`) para guiar el ojo hacia la acción principal ("Analizar Imagen").
* **Resultados Clínicos:** El resultado exitoso del modelo se resalta con tonos verde esmeralda (`text-emerald-400`) transmitiendo éxito y precisión científica.

### B. Layout Mobile-First
* **Contenedor Responsivo:** En pantallas de escritorio, el contenido se confina en una caja centrada de ancho máximo móvil (`sm:max-w-md`) y bordes curvos muy acentuados (`rounded-[36px]`), simulando el marco de un dispositivo físico real.
* **Componentes de Acción:** Los botones de galería y cámara son grandes bloques de acción rápida (`p-5`, `rounded-2xl`) con íconos vectoriales centrados, facilitando el tacto con el dedo (tappable areas).
* **Footer de Propiedad Intelectual:** Conforme a las instrucciones del proyecto, el footer con el texto exacto `"Copyright © Cristian Darwin Flores Cueva"` se fija en la parte inferior del layout, manteniendo una opacidad media (`text-slate-500`) para no competir visualmente con la zona de navegación de la app.

### C. Micro-animaciones
* **Transición de Pestañas:** Se aplican utilidades de transición nativas de Tailwind (`transition-all duration-300`) y animaciones de entrada (`animate-in fade-in slide-in-from-bottom-2`) para suavizar el cambio de vistas de la app, emulando la fluidez de las vistas en un sistema operativo móvil nativo.
