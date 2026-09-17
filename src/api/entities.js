import { supabase } from './supabaseClient'

function parseSort(sort) {
  if (!sort) return null
  const descending = sort.startsWith('-')
  return { column: descending ? sort.slice(1) : sort, ascending: !descending }
}

/**
 * Thin query helper mirroring the shape the app's pages call
 * (list/filter/create/update/delete/subscribe) so page code reads like
 * plain CRUD regardless of the Postgres table underneath.
 */
function createEntity(table) {
  return {
    async list(sort, limit) {
      let query = supabase.from(table).select('*')
      const s = parseSort(sort)
      if (s) query = query.order(s.column, { ascending: s.ascending })
      if (limit) query = query.limit(limit)
      const { data, error } = await query
      if (error) throw error
      return data
    },

    async filter(match, sort, limit) {
      let query = supabase.from(table).select('*').match(match)
      const s = parseSort(sort)
      if (s) query = query.order(s.column, { ascending: s.ascending })
      if (limit) query = query.limit(limit)
      const { data, error } = await query
      if (error) throw error
      return data
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
      if (error) throw error
      return data
    },

    async create(values) {
      const { data, error } = await supabase.from(table).insert(values).select().single()
      if (error) throw error
      return data
    },

    async update(id, values) {
      const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },

    /** Realtime subscription. Returns an unsubscribe function. */
    subscribe(callback) {
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const type = payload.eventType === 'INSERT' ? 'create' : payload.eventType === 'UPDATE' ? 'update' : 'delete'
          callback({ type, id: (payload.new || payload.old)?.id, data: payload.new ?? payload.old })
        })
        .subscribe()
      return () => supabase.removeChannel(channel)
    },
  }
}

export const Store = createEntity('stores')
export const MaintenanceTeam = createEntity('maintenance_teams')
export const MaintenanceTask = createEntity('maintenance_tasks')
export const AppNotification = createEntity('app_notifications')
// `profiles` is the equivalent of base44's built-in User entity.
export const Users = createEntity('profiles')
