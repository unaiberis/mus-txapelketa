import type { CrudInterface, Storage } from '@unitetheculture/brackets-manager/dist/types'

// Minimal in-memory storage implementing CrudInterface / Storage for manager usage
export class InMemoryStorage implements Storage {
  data: Record<string, any[]> = {
    stage: [],
    group: [],
    round: [],
    match: [],
    match_game: [],
    participant: []
  }

  private nextId(table: string) {
    const arr = this.data[table] || []
    let max = -1
    for (const it of arr) {
      if (typeof it.id === 'number') max = Math.max(max, it.id)
    }
    return max + 1
  }

  async insert(table: any, value: any): Promise<any> {
    if (Array.isArray(value)) {
      for (const v of value) {
        await this.insert(table, v)
      }
      return true
    }
    const id = this.nextId(table as string)
    const entry = { ...(value as any), id }
    this.data[table] = (this.data[table] || []).concat([entry])
    return id
  }

  async select(table: any, arg?: any): Promise<any> {
    const tableArr = this.data[table] || []
    if (typeof arg === 'undefined') return tableArr.slice()
    if (typeof arg === 'number') return tableArr.find((x) => x.id === arg) || null
    // filter
    const filter = arg as Record<string, any>
    return tableArr.filter((item) => {
      for (const k of Object.keys(filter)) {
        if ((item as any)[k] !== (filter as any)[k]) return false
      }
      return true
    })
  }

  async update(table: any, idOrFilter: any, value: any): Promise<boolean> {
    const tableArr = this.data[table] || []
    if (typeof idOrFilter === 'number') {
      const idx = tableArr.findIndex((x) => x.id === idOrFilter)
      if (idx === -1) return false
      tableArr[idx] = value
      this.data[table] = tableArr
      return true
    }
    // filter update
    const filter = idOrFilter as Record<string, any>
    let updated = false
    for (let i = 0; i < tableArr.length; i++) {
      const item = tableArr[i]
      let match = true
      for (const k of Object.keys(filter)) {
        if (item[k] !== filter[k]) { match = false; break }
      }
      if (match) {
        this.data[table][i] = { ...item, ...(value as any) }
        updated = true
      }
    }
    return updated
  }

  async delete(table: any, filter?: any): Promise<boolean> {
    if (!filter) {
      this.data[table] = []
      return true
    }
    const before = (this.data[table] || []).length
    this.data[table] = (this.data[table] || []).filter((item) => {
      for (const k of Object.keys(filter)) {
        if (item[k] !== filter[k]) return true
      }
      // drop matching
      return false
    })
    return (this.data[table] || []).length < before
  }

  async selectFirst(table: any, filter: any) {
    const arr = await this.select(table, filter)
    return Array.isArray(arr) ? (arr[0] || null) : arr
  }

  async selectLast(table: any, filter: any) {
    const arr = await this.select(table, filter)
    return Array.isArray(arr) ? (arr[arr.length - 1] || null) : arr
  }
}

export default InMemoryStorage
