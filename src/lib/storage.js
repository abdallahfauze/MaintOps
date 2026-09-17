import { supabase } from '@/api/supabaseClient'

/** Uploads a photo to the public `task-photos` bucket and returns its public URL. */
export async function uploadTaskPhoto(file) {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('task-photos').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('task-photos').getPublicUrl(path)
  return data.publicUrl
}
