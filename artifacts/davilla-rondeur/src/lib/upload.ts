import { adminPresignUpload } from "@workspace/api-client-react";

export async function uploadProductImage(file: File): Promise<string> {
  const presign = await adminPresignUpload({
    filename: file.name,
    contentType: file.type,
  });

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadResponse.ok) {
    throw new Error("Échec de l'upload vers R2");
  }

  return presign.publicUrl;
}
