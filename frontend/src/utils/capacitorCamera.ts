/**
 * Capacitor Camera Helper
 * 
 * Uses the native @capacitor/camera plugin when running inside Capacitor (APK),
 * and falls back to the browser's mediaDevices API when running on the web.
 */
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

/**
 * Detects whether the app is running inside a native Capacitor shell (Android/iOS)
 * vs. a standard web browser.
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform()
}

/**
 * Opens the native camera using @capacitor/camera plugin.
 * Returns a base64 data URL string of the captured photo.
 * Throws if the user cancels or permission is denied.
 */
export const takePhotoNative = async (): Promise<string> => {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    width: 640,
    height: 640,
    correctOrientation: true,
  })

  if (!photo.dataUrl) {
    throw new Error('No se pudo obtener la imagen de la cámara nativa.')
  }

  return photo.dataUrl
}

/**
 * Opens the native gallery picker using @capacitor/camera plugin.
 * Returns a base64 data URL string of the selected photo.
 */
export const pickFromGalleryNative = async (): Promise<string> => {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
    width: 640,
    height: 640,
    correctOrientation: true,
  })

  if (!photo.dataUrl) {
    throw new Error('No se pudo obtener la imagen de la galería.')
  }

  return photo.dataUrl
}
