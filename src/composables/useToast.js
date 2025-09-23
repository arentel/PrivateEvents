import { toastController } from '@ionic/vue'

export function useToast() {
  const showToast = async (message, color = 'success', duration = 3000) => {
    const toast = await toastController.create({
      message,
      duration,
      color,
      position: 'bottom',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    })

    await toast.present()
    return toast
  }

  const showSuccessToast = (message, duration = 3000) => {
    return showToast(message, 'success', duration)
  }

  const showErrorToast = (message, duration = 4000) => {
    return showToast(message, 'danger', duration)
  }

  const showWarningToast = (message, duration = 3500) => {
    return showToast(message, 'warning', duration)
  }

  const showInfoToast = (message, duration = 3000) => {
    return showToast(message, 'primary', duration)
  }

  return {
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast
  }
}