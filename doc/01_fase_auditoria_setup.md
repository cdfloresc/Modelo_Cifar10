# Auditoría Técnica y Configuración Inicial del Monorepo

Este documento presenta la auditoría del cuaderno de entrenamiento, la justificación de la arquitectura de directorios seleccionada y las especificaciones detalladas de la pila tecnológica (Tech Stack) para el desarrollo de la aplicación web progresiva (PWA) de reconocimiento de imágenes.

---

## 1. Análisis Técnico y Auditoría del Notebook

Se ha auditado el cuaderno de entrenamiento `practica-final-aprendizaje-profundo-unidad-i.ipynb` contrastándolo rigurosamente contra la rúbrica y las especificaciones metodológicas provistas en `Práctica Final Aprendizaje Profundo - Unidad I.pdf`.

### A. Cumplimiento de la Rúbrica y Requisitos

| Criterio Rúbrica (Peso) | Estado en el Notebook | Análisis Detallado |
| :--- | :--- | :--- |
| **1. Marco Teórico (15%)** | **CUMPLIDO** | Se responden las 8 preguntas de análisis obligatorio al final del notebook de forma profunda, cubriendo temas como pooling vs dense, filtros, ReLU, Softmax, optimizadores (Adam), generalización, y la aplicación al contexto regional (Puno). |
| **2. Exploración del dataset (10%)** | **CUMPLIDO (Con Variación)** | El PDF propone principalmente el dataset EuroSAT. Sin embargo, el notebook utiliza **CIFAR-10** (60k imágenes, 10 clases), el cual figura explícitamente en la lista de datasets validados (Pág. 3 del PDF). Se definen correctamente las clases, se analiza la dimensionalidad y se configuran pipelines eficientes con `tf.data`. |
| **3. CNN Propia (15%)** | **CUMPLIDO (Optimizado)** | Implementa una arquitectura convolucional propia con 3 bloques (Conv2D -> BatchNormalization -> Activation -> MaxPooling). Se aplica Data Augmentation (`RandomFlip`, `RandomRotation`, `RandomTranslation`). Además, se introduce una optimización técnica: reemplazo de la capa `Flatten` tradicional por `GlobalAveragePooling2D` para reducir drásticamente los parámetros y mitigar el sobreajuste. |
| **4. Transfer Learning (15%)** | **CUMPLIDO (Optimizado)** | Implementa la arquitectura preentrenada **EfficientNetB0** (pesos de ImageNet). Debido a que CIFAR-10 tiene imágenes de $32 \times 32$ y EfficientNet requiere $224 \times 224$, introduce una capa de `Resizing(224, 224)` y encapsula el preprocesamiento oficial (`preprocess_input`) en una capa `Lambda` para garantizar la correcta exportación y serialización del modelo. |
| **5. Fine-Tuning (10%)** | **CUMPLIDO** | Descongela las últimas 20 capas del modelo base, recompila con una tasa de aprendizaje (Learning Rate) de $10^{-5}$ y entrena por 5 épocas adicionales aplicando `EarlyStopping` y `ModelCheckpoint`. |
| **6. Evaluación de resultados (10%)** | **CUMPLIDO** | Realiza una partición científica estricta: 80% entrenamiento (40,000 imágenes), 20% validación (10,000 imágenes) y aísla por completo el set de test de CIFAR-10 (10,000 imágenes). Genera curvas de pérdida/exactitud, el `classification_report` (Precision, Recall, F1) y la matriz de confusión con Seaborn sobre datos no vistos. |
| **7. Aplicación web/móvil (15%)** | **FASE ACTUAL** | El PDF muestra un ejemplo de aplicación básica con Streamlit. La fase actual extenderá este requisito construyendo un sistema desacoplado (FastAPI + React PWA). |
| **8. Simulación y defensa (10%)** | **CUMPLIDO (Metodología)** | Se define la función `reconocer_imagen` para inferencia con imágenes externas, y se detallan las limitaciones y el Shift de Covariable en la sección teórica. |

### B. Discrepancias y Ajustes Técnicos
* **Dataset Principal:** El PDF utiliza EuroSAT (imágenes de satélite) en sus ejemplos de código, mientras que el notebook y el modelo final (`modelo_final_cifar10.keras`) emplean CIFAR-10. Ambas opciones son válidas según los datasets validados de la rúbrica.
* **Mixed Precision:** El notebook añade `tf.keras.mixed_precision.set_global_policy('mixed_float16')` para acelerar el entrenamiento en GPU. Esto requiere forzar la capa de salida del modelo a `float32` para estabilidad numérica en la función Softmax, lo cual fue implementado correctamente en el notebook.
* **Batch Normalization y GAP:** La CNN propia del notebook es sustancialmente más robusta y moderna que la del ejemplo del PDF, ya que incluye normalización por lotes en cada bloque y un agregador global promedio en lugar de aplanar tensores.

---

## 2. Justificación de la Arquitectura del Monorepo

Para garantizar un desarrollo profesional, escalable y preparado para empaquetado nativo híbrido (Capacitor), se opta por una arquitectura de **Monorepo** estructurada de la siguiente manera:

```text
/ (Raíz del Monorepo)
├── package.json                   # Orquestación de scripts generales y dependencias de desarrollo
├── .gitignore                     # Exclusiones globales de Git
├── backend/                       # API Rest con FastAPI y TensorFlow
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # Rutas y configuración de FastAPI
│   │   ├── model_loader.py        # Carga del modelo e inferencia con TensorFlow
│   │   └── schemas.py             # Validación de datos y tipado con Pydantic
│   └── requirements.txt           # Dependencias de Python
├── frontend/                      # Aplicación PWA con React, Vite y Tailwind CSS
│   ├── public/                    # Assets estáticos, manifest de PWA, Service Worker
│   ├── src/                       # Código fuente de React
│   ├── package.json               # Dependencias de npm y scripts de compilación Vite
│   ├── vite.config.ts             # Configuración de Vite (incluye soporte PWA)
│   └── tsconfig.json              # Configuración de TypeScript
├── doc/                           # Documentación técnica
│   └── 01_fase_auditoria_setup.md # Este documento de auditoría
└── modelo/                        # Directorio para almacenar los pesos del modelo
    └── modelo_final_cifar10.keras # Modelo CIFAR-10 serializado en formato Keras v3
```

### Justificación de las Decisiones de Diseño:
1. **Desacoplamiento Frontend/Backend:** La inferencia con modelos pesados de TensorFlow (`~38MB` para CIFAR-10 adaptado a EfficientNet) consume CPU/RAM y requiere dependencias nativas de C++. Mantener el backend separado en FastAPI evita sobrecargar la interfaz de usuario y permite escalar la API independientemente en la nube.
2. **React (Vite) + TypeScript:** Vite ofrece un entorno de compilación ultra-rápido basado en ESM nativo. El uso de TypeScript mitiga errores de tipado de datos en las peticiones y respuestas con el backend.
3. **Diseño Mobile-First con Tailwind CSS:** Tailwind facilita la creación de layouts flexibles y fluidos usando clases utilitarias integradas en el CSS, garantizando que el diseño emule componentes móviles nativos.
4. **Preparación para Capacitor:** Capacitor requiere que el frontend genere una build estática (usualmente en `/dist`). El backend de FastAPI servirá como una API remota, lo que facilita el empaquetado del frontend web en una aplicación Android/iOS nativa sin alterar la lógica de negocio.

---

## 3. Pila Tecnológica (Tech Stack) Exacta

A continuación se detalla la pila de tecnologías y versiones recomendadas para asegurar la compatibilidad e interoperabilidad de los módulos.

### A. Capa de MLOps e Inferencia (Backend)
* **Lenguaje:** `Python 3.10` o superior.
* **Framework Web:** `FastAPI` (v0.110+) - Para construir APIs asíncronas de alto rendimiento y autogeneración de OpenAPI (Swagger).
* **Servidor ASGI:** `Uvicorn` (v0.28+) - Servidor de alto rendimiento para correr FastAPI.
* **Engine de Deep Learning:** `TensorFlow` (v2.16+) - Específicamente para la carga y ejecución de inferencia del formato `.keras` nativo de Keras 3.
* **Procesamiento de Imágenes y Datos:**
  - `Pillow` (v10.2+) - Carga y manipulación de archivos de imagen enviados por el usuario.
  - `numpy` (v1.26+) - Manipulación de vectores numéricos e normalización de imágenes para alimentar la red.
* **Validación de Datos:** `Pydantic` (v2.6+) - Validación de esquemas JSON en las solicitudes.

### B. Capa de Experiencia de Usuario (Frontend)
* **Runtime:** `Node.js` (v18 o v20 LTS).
* **Bundler & Dev Server:** `Vite` (v5+) - Transpilación rápida mediante ESBuild.
* **Librería UI:** `React` (v18+) - Componentización reactiva de la interfaz.
* **Lenguaje:** `TypeScript` (v5+) - Tipado estático estricto.
* **Estilos:** `Tailwind CSS` (v4+) - Framework CSS utilitario configurado mediante directivas nativas `@import` para simplificar la configuración.
* **Librería de Componentes/Iconos:** `Lucide React` (Iconografía moderna y responsiva).

### C. Despliegue y Empaquetado
* **PWA:** `vite-plugin-pwa` - Configuración automatizada de Service Workers para caché offline y soporte de manifiesto web (instalar en pantalla de inicio).
* **Contenedores (Opcional):** `Docker` para encapsular la API de FastAPI con TensorFlow de forma portable.
* **Móvil (Fase Futura):** `@capacitor/core` y `@capacitor/cli` para compilar el bundle estático de React a plataformas nativas Android/iOS.
