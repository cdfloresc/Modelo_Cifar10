import React, { useRef, useState } from 'react'
import { Upload, Camera } from 'lucide-react'
import { CameraUploader } from './CameraUploader'
import { isNativePlatform, takePhotoNative, pickFromGalleryNative } from '../utils/capacitorCamera'

interface ImageUploaderProps {
  onImageSelected: (image: string | File) => void
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  /**
   * Gallery handler: Uses @capacitor/camera on native, or HTML input on web.
   */
  const handleGalleryClick = async () => {
    if (isNativePlatform()) {
      try {
        const dataUrl = await pickFromGalleryNative()
        onImageSelected(dataUrl)
      } catch (err) {
        // User cancelled or permission denied - silently ignore
        console.warn('Native gallery pick cancelled or failed:', err)
      }
    } else {
      // Fallback: Standard HTML file input for web browsers
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageSelected(file)
    }
  }

  /**
   * Camera handler: Uses @capacitor/camera on native, or web mediaDevices fallback.
   */
  const handleCameraClick = async () => {
    if (isNativePlatform()) {
      try {
        const dataUrl = await takePhotoNative()
        onImageSelected(dataUrl)
      } catch (err) {
        // User cancelled or permission denied - silently ignore
        console.warn('Native camera cancelled or failed:', err)
      }
    } else {
      // Fallback: Open the custom CameraUploader component that uses navigator.mediaDevices
      setIsCameraOpen(true)
    }
  }

  const handleCameraCapture = (dataUrl: string) => {
    setIsCameraOpen(false)
    onImageSelected(dataUrl)
  }

  return (
    <div className="space-y-4">
      {/* Hidden File Input for Gallery (web fallback only) */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden" 
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Gallery Button */}
        <button
          type="button"
          onClick={handleGalleryClick}
          className="flex flex-col items-center justify-center p-5 bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 border border-slate-200 dark:border-slate-800/25 rounded-2xl transition-all hover:scale-[1.02] active:scale-98 group gap-2.5"
        >
          <div className="w-11 h-11 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-violet-600/20">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Subir de Galería</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">JPG, PNG o WEBP</span>
          </div>
        </button>

        {/* Camera Button */}
        <button
          type="button"
          onClick={handleCameraClick}
          className="flex flex-col items-center justify-center p-5 bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 border border-slate-200 dark:border-slate-800/25 rounded-2xl transition-all hover:scale-[1.02] active:scale-98 group gap-2.5"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-indigo-600/20">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Tomar Foto</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Usar Cámara Nativa</span>
          </div>
        </button>
      </div>

      {/* Camera Stream Overlay (web fallback only - hidden on native Capacitor) */}
      {isCameraOpen && (
        <CameraUploader 
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  )
}
