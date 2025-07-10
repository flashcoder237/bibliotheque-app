import { showToast } from './notifications.js';

export async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur serveur');
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Erreur serveur');
      }
    }
    if (contentType && contentType.indexOf('application/json') !== -1) {
      return await res.json();
    } else {
      const text = await res.text();
      throw new Error(text || 'Réponse inattendue du serveur');
    }
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}
