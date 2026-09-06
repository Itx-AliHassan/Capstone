export async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) throw new Error('Cloudinary env values are missing')
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', uploadPreset)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: form })
  if (!response.ok) throw new Error('Cloudinary upload failed')
  const data = await response.json()
  return data.secure_url
}
