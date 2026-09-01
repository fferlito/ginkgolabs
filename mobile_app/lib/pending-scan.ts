type PendingPhoto = { uri: string; mimeType?: string };

let pendingPhoto: PendingPhoto | null = null;

export function setPendingScanPhoto(photo: PendingPhoto | null) {
  pendingPhoto = photo;
}

export function takePendingScanPhoto(): PendingPhoto | null {
  const next = pendingPhoto;
  pendingPhoto = null;
  return next;
}
