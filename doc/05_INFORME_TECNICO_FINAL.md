# Informe Técnico Final: Sistema PWA de Reconocimiento de Imágenes (CIFAR-10)
**Curso:** Aprendizaje Profundo  
**Autor:** Cristian Darwin Flores Cueva  
**Institución:** Universidad Nacional del Altiplano - Ingeniería de Sistemas  
**Fecha:** Junio 2026  

---

## 1. Introducción y Objetivos del Sistema

### 1.1 Contexto y Relevancia
En la actualidad, la clasificación automatizada de imágenes es uno de los pilares del Aprendizaje Profundo (Deep Learning) y la Visión Artificial. Modelos avanzados como las Redes Convolucionales (CNN) permiten extraer patrones jerárquicos complejos de datos tridimensionales (alto, ancho, canales de color) con un rendimiento superior al de las redes neuronales densas tradicionales. 

Este proyecto se enfoca en resolver el problema de clasificación sobre el conjunto de datos estándar **CIFAR-10** (compuesto por 10 categorías: avión, automóvil, pájaro, gato, ciervo, perro, rana, caballo, barco y camión), utilizando una arquitectura híbrida de **Transfer Learning** y **Fine-Tuning** sobre la red base **EfficientNetB0**. 

El sistema final está diseñado para ser desplegado bajo la modalidad de **Aplicación Web Progresiva (PWA)** enfocada en la filosofía *Mobile-First*. Esto permite que el aplicativo emule la experiencia de usuario de un cliente móvil nativo y, a su vez, quede completamente preparado para un futuro empaquetado híbrido multiplataforma utilizando **Capacitor**.

### 1.2 Objetivos del Sistema
* **Inferencia de Alto Rendimiento:** Implementar un backend asíncrono con FastAPI que cargue el modelo Keras en memoria al arrancar (lifespan) y realice la inferencia en milisegundos.
* **Diseño Mobile-First Tactil:** Desarrollar una interfaz de usuario fluida con React y Tailwind CSS, donde todos los elementos de control táctiles superen el estándar de usabilidad de 44px de alto.
* **Integración de Cámara Nativa:** Acceder a la cámara física del dispositivo móvil a través de APIs web puras (HTML5 MediaDevices), realizando un procesamiento de corte y normalización local.
* **Transparencia Académica:** Responder de manera interactiva a los cuestionamientos obligatorios de la rúbrica académica (convoluciones, ReLU, Softmax, optimizadores).
* **Arquitectura de Monorepo Escalonable:** Consolidar el código del cliente y servidor en una estructura limpia y fácil de desplegar localmente.

---

## 2. Arquitectura del Sistema

El sistema implementa un patrón de arquitectura física desacoplada para separar la carga pesada de inferencia numérica de la lógica de presentación del usuario.

### 2.1 Diagrama Conceptual del Flujo End-to-End
A continuación se detalla el ciclo de vida de los datos, desde la entrada de la imagen física hasta el renderizado de gráficos:

```mermaid
sequenceDiagram
    participant U as Usuario (Móvil)
    participant FE as Frontend PWA (React)
    participant BE as Backend API (FastAPI)
    participant MD as Modelo (EfficientNet Keras)

    U->>FE: Toma foto (Cámara) o Sube de Galería
    FE->>FE: Recorta a 1:1, genera DataURL y convierte a File binario
    U->>FE: Presiona "Analizar Imagen"
    FE->>FE: Bloquea UI y muestra Skeleton Loader (isAnalyzing=true)
    FE->>BE: HTTP POST /api/predict (Multipart FormData)
    BE->>BE: Valida tipo MIME e integridad (Pillow)
    BE->>BE: Preprocesa tensor a (1, 32, 32, 3) a escala [0.0, 255.0]
    BE->>MD: Inferencia (model.predict)
    subgraph Keras Model Graph
        MD->>MD: Capa Resizing: (1, 224, 224, 3)
        MD->>MD: Capa Lambda (preprocess_input EfficientNet)
        MD->>MD: Inferencia convolucional
    end
    MD-->>BE: Retorna vector de probabilidades (1, 10)
    BE-->>FE: HTTP 200 OK con JSON (PredictionResponse)
    FE->>FE: Registra en Historial local y almacena estado
    FE->>FE: Desactiva loader (isAnalyzing=false)
    FE->>U: Renderiza ResultCard con barras Recharts ordenadas de mayor a menor
```

### 2.2 Beneficios de la Arquitectura Desacoplada
1. **Separación de Responsabilidades:** El frontend maneja las restricciones de renderizado en el cliente, la interacción de cámara nativa y la animación. El backend se dedica exclusivamente a la carga de TensorFlow y la manipulación lineal de tensores.
2. **Eficiencia en Recursos:** Los modelos de aprendizaje profundo en TensorFlow exigen altas cantidades de CPU y memoria RAM. Correr el modelo en un backend en la nube o local evita saturar la memoria web del navegador móvil del cliente.
3. **Escalabilidad PWA a Capacitor:** Dado que el frontend se comunica únicamente vía endpoints JSON estandarizados, el bundle estático compilado en React es autocontenido y puede cargarse localmente dentro de WebViews móviles nativos (Capacitor) sin depender de servidores Python móviles.

---

## 3. Detalles del Modelo de Deep Learning

### 3.1 Dataset Utilizado
Se utilizó el dataset **CIFAR-10**, el cual consiste en $60,000$ imágenes a color de $32 \times 32$ píxeles divididas de manera uniforme en 10 clases mutuamente excluyentes (6,000 imágenes por clase). Se dividió el dataset en:
* **Train Set:** 40,000 imágenes (80% del set de desarrollo).
* **Validation Set:** 10,000 imágenes (20% del set de desarrollo).
* **Test Set:** 10,000 imágenes (completamente aisladas para verificación de generalización).

### 3.2 Arquitectura de Redes del Notebook
El cuaderno de trabajo implementó dos aproximaciones principales:
1. **Red Convolucional (CNN) Propia:**
   * Bloques Convolucionales: 3 bloques compuestos por capas `Conv2D` con regularización `BatchNormalization` y función de activación `ReLU`.
   * Agregación Espacial: Se utilizó `GlobalAveragePooling2D` en lugar de una capa `Flatten` clásica para reducir drásticamente el conteo de parámetros entrenables y mitigar el sobreajuste (overfitting).
   * Regularización: Capas `Dropout` del 30% al 50%.
2. **Transfer Learning + Fine-Tuning (Modelo Final):**
   * **Modelo Base:** `EfficientNetB0` cargado con los pesos preentrenados de `ImageNet`.
   * **Adaptación de Entrada:** Dado que las dimensiones nativas del dataset son de $32 \times 32$ y `EfficientNetB0` requiere al menos $224 \times 224$, se embebió una capa `Resizing(224, 224)` al inicio del modelo.
   * **Preprocesamiento Embebido:** Se incorporó una capa `Lambda` que ejecuta `preprocess_input` de EfficientNet, empaquetando la normalización de la imagen dentro de la definición del modelo serializado.
   * **Fine-Tuning:** Se congelaron los pesos iniciales del modelo base, entrenando la cabeza de clasificación (Dense layers + Softmax). Posteriormente, se descongelaron las últimas 20 capas convolucionales de `EfficientNetB0`, reentrenando con una tasa de aprendizaje minúscula ($\eta = 10^{-5}$) y detención temprana (`EarlyStopping`).

### 3.3 Métricas Obtenidas
El modelo basado en EfficientNetB0 alcanzó una **Exactitud (Accuracy) de ~87.5%** sobre el conjunto de test. Este resultado supera considerablemente a la red convolucional propia y al baseline de redes densas tradicionales, demostrando el poder de la transferencia de conocimiento en dominios con resoluciones bajas como CIFAR-10.

---

## 4. Desarrollo del Backend (FastAPI)

El backend está construido sobre **FastAPI** y configurado para funcionar de forma asíncrona y eficiente.

### 4.1 Carga Lifespan del Modelo en Memoria
Para evitar la sobrecarga (overhead) de leer y deserializar el archivo del modelo `.keras` de 38MB en cada petición HTTP, se implementó el manejador de ciclo de vida `lifespan` de FastAPI. Esto carga el modelo en memoria RAM exactamente una vez durante el arranque del servidor web y lo mantiene disponible durante toda la ejecución.

### 4.2 Resolución de Deserialización (Monkey-Patch Keras)
Al cargar el modelo final con Keras 3, surgió una incompatibilidad técnica: la definición del modelo serializado contenía parámetros de cuantización (`quantization_config`) en capas densas que la versión de TensorFlow instalada localmente no lograba deserializar directamente. 

Para resolver este inconveniente sin alterar los pesos del archivo original `.keras`, se implementó un **monkey-patch** dinámico en el archivo de inicio `model_loader.py` antes de invocar la carga del modelo:
```python
import keras
original_dense_init = keras.layers.Dense.__init__

def custom_dense_init(self, *args, **kwargs):
    if 'quantization_config' in kwargs:
        kwargs.pop('quantization_config') # Elimina el atributo incompatible
    original_dense_init(self, *args, **kwargs)

keras.layers.Dense.__init__ = custom_dense_init
```

### 4.3 Flujo de Preprocesamiento Matemático de Tensores
El endpoint `/api/predict` sigue una tubería (pipeline) de transformación estricta:
1. **Lectura Binaria:** Recibe la imagen mediante `UploadFile` y verifica el tipo MIME.
2. **Decodificación de Imagen:** Abre los bytes con Pillow (`Image.open(io.BytesIO(contents))`).
3. **Normalización del Espacio de Color:** Convierte a RGB (`.convert("RGB")`) para eliminar el canal de transparencia si es un PNG.
4. **Redimensionamiento Físico:** Redimensiona a $32 \times 32$ píxeles.
5. **Conversión a Vector Numpy:** Transforma en matriz `float32`.
6. **Expansión de Dimensiones:** Expande a la forma `(1, 32, 32, 3)`.
7. **Inferencia:** Pasa el tensor a `model.predict()`. Al finalizar, se extrae el vector de salida y se mapea con los nombres de las clases en español.

---

## 5. Desarrollo del Frontend (React & Tailwind)

El frontend está desarrollado bajo el paradigma de componentes declarativos de React y estilizado con Tailwind CSS v4 para simular un contenedor móvil.

### 5.1 Decisiones de Diseño UI/UX Mobile-First y Adaptación Responsiva
* **Adaptación Responsiva Híbrida (Web/Móvil):** El diseño detecta dinámicamente el ancho de la pantalla del cliente. En pantallas móviles, se comporta como una aplicación nativa confinada con barra de estado y navegación inferior. En resoluciones de escritorio (pantallas `md` o superiores), el contenedor principal se ensancha a un panel web (`max-w-5xl`), oculta los componentes telefónicos simulados, mueve las pestañas a la cabecera superior, y distribuye el flujo principal en una cuadrícula de dos columnas:
  - **Columna Izquierda:** Enfocada en la entrada de datos (caja de carga o previsualización de imagen) y el banco de pruebas de CIFAR-10.
  - **Columna Derecha:** Dedicada a los resultados y visualización de barras Recharts, o a un estado vacío decorativo si no se ha analizado ninguna imagen.
* **Componentes Táctiles (Target Size):** Todos los botones clave (Limpiar Imagen, Cambiar, Analizar, conmutadores y pestañas) poseen un tamaño físico mínimo de **44px de alto** (e.g., `h-11 flex items-center justify-center` o `py-2` con iconos grandes), facilitando la precisión al pulsar con el dedo en pantallas táctiles.
* **Conmutación Funcional de Temas (Claro/Oscuro):** Se integró una reactividad completa de colores donde, al alternar el botón de tema, se remueve o añade la clase `dark` del elemento `html` raíz. Los fondos de la página, tarjetas, bordes, tipografías e incluso los ejes y celdas del gráfico SVG de Recharts se ajustan de manera coordinada para garantizar el máximo contraste y legibilidad en ambas configuraciones.
* **Micro-animaciones fluidas:** Las transiciones de pestañas y cambios de estado utilizan clases utilitarias de animación (`animate-in fade-in slide-in-from-bottom-2 duration-300`) para suavizar los cambios visuales, emulando la fluidez de un sistema operativo nativo.

### 5.2 Integración de Cámara y Captura HTML5
El componente [CameraUploader.tsx](file:///d:/Universidad/Ing.%20Sistemas/9no%20Semestre/APRENDIZAJE%20PROFUNDO/Trabajo%20Unidad%201/frontend/src/components/CameraUploader.tsx) implementa el flujo de captura asíncrona:
* **Acceso Seguro:** Antes de iniciar la captura, el código verifica de forma segura la existencia de la API `navigator.mediaDevices`. Si está ausente o deshabilitada (como ocurre en WebViews inseguros o navegadores desactualizados), previene la caída del sistema y despliega un mensaje explicativo al usuario.
* **Manejo Dinámico de Sensores:** Prioriza la cámara trasera (`facingMode: "environment"`) para permitir enfocar objetos externos. Si falla (por ejemplo, en PC con una sola cámara frontal), conmuta fluidamente a `facingMode: "user"`.
* **Corte Cuadrado y Conversión:** El video se congela al presionar el obturador. Mediante un canvas oculto, se dibuja un cuadrado central (`Math.min(videoWidth, videoHeight)`). La salida se codifica en Base64 (DataURL) y posteriormente se convierte a un archivo `File` binario para ser enviado mediante `FormData`.
* **Liberación de Recursos:** Al desmontar el componente (cierre del modal), se detienen todos los canales de video activos para liberar el hardware físico de la cámara en el teléfono.

### 5.3 Gráficos Declarativos con Recharts
Los resultados de la predicción se despliegan en el componente [ResultCard.tsx](file:///d:/Universidad/Ing.%20Sistemas/9no%20Semestre/APRENDIZAJE%20PROFUNDO/Trabajo%20Unidad%201/frontend/src/components/ResultCard.tsx):
* **Ordenamiento Dinámico:** Recibe el diccionario `probabilidades_totales` y lo ordena descendentemente de mayor a menor probabilidad.
* **Visualización Horizontal:** El gráfico se dibuja de forma vertical (`layout="vertical"`) en un contenedor flexible (`ResponsiveContainer width="100%"`), lo que facilita la visualización en teléfonos móviles.
* **Resaltado Condicional:** Se aplica color de acento púrpura brillante (`#8b5cf6`) y opacidad total a la barra con mayor probabilidad (clase ganadora). Las 9 clases restantes se colorean en tono pizarra apagado (`#475569`) al 60% de opacidad, permitiendo comprender la predicción de forma instantánea.

---

## 6. Guía de Ejecución Local

Siga los siguientes pasos para ejecutar el monorepo en su entorno local (Probado en Windows 10/11 y PowerShell).

### 6.1 Prerrequisitos
* **Python 3.10** o superior instalado en el sistema.
* **Node.js v18** o superior con npm disponible.

### 6.2 Preparación del Entorno (PowerShell)

1. **Clonar el repositorio y situarse en la raíz del proyecto:**
   ```powershell
   cd "d:\Universidad\Ing. Sistemas\9no Semestre\APRENDIZAJE PROFUNDO\Trabajo Unidad 1"
   ```

2. **Crear y activar el entorno virtual de Python (Backend):**
   ```powershell
   # Creamos el entorno virtual en una ruta limpia para evitar problemas de longitud de caracteres
   python -m venv backend/.venv
   
   # Activar el entorno virtual
   .\backend\.venv\Scripts\Activate.ps1
   ```

3. **Instalar dependencias del Backend:**
   ```powershell
   pip install -r backend/requirements.txt
   ```

4. **Instalar dependencias de desarrollo y del Frontend (npm):**
   ```powershell
   # Instala concurrently y configura los submódulos de la raíz del monorepo
   npm install
   
   # Instala las dependencias del frontend (React, Tailwind, Recharts)
   npm install --prefix frontend
   ```

### 6.3 Ejecución en Modo Desarrollo (Dev Mode)
Para levantar el servidor backend de FastAPI y el servidor de desarrollo de Vite (React) en paralelo de forma centralizada, ejecute en la raíz del proyecto:
```powershell
npm run dev
```

* **Frontend URL:** [http://localhost:5173](http://localhost:5173) (o la IP asignada por Vite).
* **Backend Swagger API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Backend Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 6.4 Compilación y Producción
Para validar la construcción del frontend antes de su distribución:
```powershell
npm run build:frontend
```
Los archivos optimizados y estáticos se compilarán dentro de `frontend/dist/`.

---

## 7. Conclusión y Trabajo Futuro

### 7.1 Conclusiones
* **Potencia del Transfer Learning:** El uso de EfficientNetB0 preentrenado en ImageNet adaptado para CIFAR-10 mediante Fine-Tuning proporciona un salto cuantitativo en exactitud (~87.5%), demostrando que la reutilización de filtros de visión profunda es la aproximación más eficiente en entornos reales.
* **Viabilidad de las PWAs:** El diseño desacoplado Mobile-First demuestra que es posible construir herramientas de IA interactivas y complejas que corren en navegadores móviles imitando a la perfección aplicaciones nativas.
* **Robustez en WebView:** Ajustar la lógica del cliente para resistir restricciones de Webviews e implementar medidas de control táctiles de al menos 44px mejora enormemente la ergonomía digital.

### 7.2 Trabajo Futuro: Migración a Capacitor
Para empaquetar este proyecto en una aplicación móvil nativa (`.apk` para Android, `.ipa` para iOS) utilizando **Capacitor**, se proyecta la siguiente hoja de ruta:

1. **Configuración de Orígenes en Capacitor:**
   Los entornos nativos sirven archivos locales desde orígenes propios (`http://localhost` en Android y `capacitor://localhost` en iOS). La API de producción del backend ya ha sido configurada en este informe para permitir estos dominios en sus directivas CORS.
2. **Migración a APIs Nativas del Dispositivo:**
   Aunque la cámara HTML5 funciona correctamente en navegadores móviles, dentro de una WebView empaquetada de Android/iOS es preferible utilizar el plugin oficial `@capacitor/camera`. Esto permite delegar la captura a la aplicación de cámara oficial del sistema operativo, reduciendo el consumo de RAM en la WebView y garantizando acceso a los sensores físicos del zoom y flash.
3. **Inferencia Offline en el Teléfono:**
   Como mejora en la resiliencia offline, se plantea exportar el modelo a formato **ONNX** o **TensorFlow.js**. Esto permitiría cargar los pesos del clasificador directamente dentro de la aplicación móvil y ejecutar las predicciones de forma local e instantánea sin necesidad de conectividad a internet ni de comunicación con el servidor FastAPI.
