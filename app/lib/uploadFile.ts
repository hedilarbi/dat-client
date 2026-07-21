import { compressImageIfNeeded, MAX_UPLOAD_BYTES } from './imageCompression';

/**
 * Compresse (si c'est une image) puis envoie un fichier vers le stockage serveur générique
 * (POST /api/upload). Passe par fetch direct plutôt que apiRequest() car apiRequest force un
 * Content-Type JSON, incompatible avec un envoi multipart/form-data.
 *
 * @param file
 * @param folder - sous-dossier de stockage optionnel (whitelisté côté serveur, cf.
 *   server/controllers/upload.controller.js). Ignoré (fallback 'documents') si non reconnu.
 */
export async function uploadFile(file: File, folder?: string): Promise<string> {
  const compressed = await compressImageIfNeeded(file);
  if (compressed.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Le fichier est trop volumineux (${(compressed.size / (1024 * 1024)).toFixed(1)} Mo, maximum ${MAX_UPLOAD_BYTES / (1024 * 1024)} Mo).`
    );
  }

  const formData = new FormData();
  formData.append('file', compressed);
  if (folder) formData.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const responseText = await res.text();
  let data: any = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Réponse serveur invalide (${res.status}).`);
    }
  }

  if (!res.ok || !data.url) {
    throw new Error(data.message || "Échec de l'envoi du fichier.");
  }

  return data.url as string;
}
