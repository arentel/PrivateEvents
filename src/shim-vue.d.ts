/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@ionic/vue' {
  export * from '@ionic/vue/dist/types'
}

declare module 'qrious' {
  export default class QRious {
    constructor(options: any)
    toDataURL(): string
  }
}

declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string)
    static getCameras(): Promise<any[]>
    start(
      cameraIdOrConfig: string | any,
      configuration: any,
      qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void,
      qrCodeErrorCallback?: (errorMessage: string) => void
    ): Promise<void>
    stop(): Promise<void>
    isScanning: boolean
  }
}

declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: any)
    text(text: string, x: number, y: number, options?: any): void
    setFontSize(size: number): void
    setFont(fontName?: string, fontStyle?: string): void
    setTextColor(r: number, g?: number, b?: number): void
    setFillColor(r: number, g?: number, b?: number): void
    rect(x: number, y: number, width: number, height: number, style?: string): void
    line(x1: number, y1: number, x2: number, y2: number): void
    addPage(): void
    setPage(pageNumber: number): void
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void
    save(filename: string): void
    internal: {
      getNumberOfPages(): number
    }
  }
}

declare module 'crypto-js' {
  export const AES: {
    encrypt(message: string, key: string): any
    decrypt(encrypted: any, key: string): any
  }
  export const MD5: (message: string) => any
  export const enc: {
    Utf8: any
  }
}

// Variables de entorno
declare interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_FROM_EMAIL: string
  readonly VITE_QR_SECRET_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEBUG: string
  readonly VITE_LOG_LEVEL: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Extensiones globales
declare global {
  interface Window {
    fs: {
      readFile(filepath: string, options?: any): Promise<any>
    }
  }
}