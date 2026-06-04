import React, { useRef, useState, useEffect } from 'react'
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react'

interface CameraUploaderProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export const CameraUploader: React.FC<CameraUploaderProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  // Initialize Camera Stream
  useEffect(() => {
    startCamera()

    // Cleanup: stop stream when component unmounts
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    stopCamera()
    setError(null)
    setIsCameraReady(false)

    try {
      // Safeguard: Check if navigator.mediaDevices and getUserMedia are supported in the Webview/browser
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("CameraAPINotAvailable")
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
          aspectRatio: { ideal: 1 }
        },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true)
        }
      }
    } catch (err: any) {
      console.error("Camera access error:", err)
      if (err.message === "CameraAPINotAvailable") {
        setError("La API de la cámara no está disponible en este entorno. En dispositivos móviles, asegúrate de servir la app bajo HTTPS o usar un emulador de Capacitor configurado correctamente.")
      } else if (err.name === 'NotAllowedError') {
        setError("Permiso denegado. Por favor habilita el acceso a la cámara en los ajustes del navegador.")
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        // If rear camera not found, try front camera
        if (facingMode === 'environment') {
          setFacingMode('user')
        } else {
          setError("No se detectó ninguna cámara en este dispositivo.")
        }
      } else {
        setError("No se pudo acceder a la cámara. Por favor asegúrate de que no esté siendo usada por otra aplicación o que los permisos del contenedor WebView estén habilitados.")
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (ctx) {
        // Use video source dimensions
        const size = Math.min(video.videoWidth, video.videoHeight)
        canvas.width = size
        canvas.height = size

        // Crop center square
        const sx = (video.videoWidth - size) / 2
        const sy = (video.videoHeight - size) / 2

        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
        stopCamera()
        onCapture(dataUrl)
      }
    }
  }

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }

  return (
    <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col justify-between p-6 animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center text-white z-10">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Camera className="w-4 h-4 text-violet-400" />
          Capturar Imagen
        </h3>
        {/* Close Button: tactile target of 44x44px */}
        <button 
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 transition-colors border border-slate-700/40 text-slate-300 active:scale-95"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Container (Square) */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="w-full max-w-sm aspect-square bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
          
          {error ? (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center gap-3">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className="text-xs text-slate-300 font-medium leading-relaxed">{error}</p>
              {/* Retry Button: tactile target of 44px height */}
              <button 
                onClick={startCamera}
                className="mt-2 h-11 px-5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-violet-400 border border-slate-700/50 flex items-center justify-center active:scale-95"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Live Feed */}
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Shutter Overlay Guideline */}
              <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none border-dashed flex items-center justify-center">
                <div className="w-16 h-16 border border-white/5 rounded-full"></div>
              </div>

              {/* Loader */}
              {!isCameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-violet-500 animate-spin" />
                  <span className="text-xs text-slate-500">Iniciando flujo de video...</span>
                </div>
              )}
            </>
          )}

          {/* Hidden snapshot canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex justify-center items-center gap-8 py-4 z-10">
        
        {/* Toggle camera (Front/Back) */}
        {!error && isCameraReady && (
          <button 
            onClick={toggleCamera}
            className="p-3.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/40 text-slate-300 transition-all hover:scale-105 active:scale-95"
            title="Cambiar Cámara"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}

        {/* Shutter Button */}
        {!error && (
          <button 
            onClick={capturePhoto}
            disabled={!isCameraReady}
            className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-slate-800 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
            aria-label="Capturar Foto"
          >
            <div className="w-12 h-12 rounded-full border border-slate-900 bg-transparent"></div>
          </button>
        )}

        {/* Placeholder spacer to balance layout */}
        {!error && isCameraReady && <div className="w-[50px] h-[50px]" />}
      </div>
      
    </div>
  )
}
