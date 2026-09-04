import { File, UploadType } from "expo-file-system";

/** Expo's WinterCG fetch rejects RN `{ uri, name, type }` FormData parts. */
export function localImageFile(uri: string): File {
  return new File(uri);
}

export async function putLocalFile(
  uri: string,
  url: string,
  contentType: string,
): Promise<{ status: number; body: string }> {
  const file = localImageFile(uri);
  return file.upload(url, {
    httpMethod: "PUT",
    uploadType: UploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
    mimeType: contentType,
  });
}
