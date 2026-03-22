import type { Storage } from '@unitetheculture/brackets-manager/dist/types'

// Minimal in-memory storage implementing CrudInterface / Storage for manager usage
export class InMemoryStorage implements Storage {
  data: Record<string, Record<string, unknown>[]> = {
    stage: [],
    group: [],
    round: [],
    match: [],
    match_game: [],
    participant: [],
  };

  private nextId(table: string) {
    const arr = this.data[table] || [];
    let max = -1;
    for (const it of arr) {
      if (typeof (it as Record<string, unknown>).id === 'number') max = Math.max(max, (it as Record<string, unknown>).id as number);
    }
    return max + 1;
  }

  async insert(table: string, value: unknown): Promise<number | boolean> {
    if (Array.isArray(value)) {
      for (const v of value) {
        await this.insert(table, v);
      }
      return true;
    }
    const id = this.nextId(table);
    const entry = { ...((value as unknown) as Record<string, unknown>), id };
    this.data[table] = (this.data[table] || []).concat([entry]);
    return id;
  }

  async select(table: string, arg?: unknown): Promise<unknown> {
    const tableArr = this.data[table] || [];
    if (typeof arg === 'undefined') return tableArr.slice();
    if (typeof arg === 'number') return tableArr.find((x) => (x as Record<string, unknown>).id === arg) || null;
    // filter
    const filter = arg as Record<string, unknown>;
    return tableArr.filter((item) => {
      for (const k of Object.keys(filter)) {
        if ((item as Record<string, unknown>)[k] !== filter[k]) return false;
      }
      return true;
    });
  }

  async update(table: string, idOrFilter: unknown, value: unknown): Promise<boolean> {
    const tableArr = this.data[table] || [];
    if (typeof idOrFilter === 'number') {
      const idx = tableArr.findIndex((x) => (x as Record<string, unknown>).id === idOrFilter);
      if (idx === -1) return false;
      tableArr[idx] = value as Record<string, unknown>;
      this.data[table] = tableArr;
      return true;
    }
    // filter update
    const filter = idOrFilter as Record<string, unknown>;
    let updated = false;
    for (let i = 0; i < tableArr.length; i++) {
      const item = tableArr[i];
      let match = true;
      for (const k of Object.keys(filter)) {
        if ((item as Record<string, unknown>)[k] !== filter[k]) {
          match = false;
          break;
        }
      }
      if (match) {
        this.data[table][i] = { ...(item as Record<string, unknown>), ...(value as Record<string, unknown>) };
        updated = true;
      }
    }
    return updated;
  }

  async delete(table: string, filter?: unknown): Promise<boolean> {
    if (!filter) {
      this.data[table] = [];
      return true;
    }
    const before = (this.data[table] || []).length;
    this.data[table] = (this.data[table] || []).filter((item) => {
      for (const k of Object.keys(filter as Record<string, unknown>)) {
        if ((item as Record<string, unknown>)[k] !== (filter as Record<string, unknown>)[k]) return true;
      }
      // drop matching
      return false;
    });
    return (this.data[table] || []).length < before;
  }

  async selectFirst(table: string, filter: unknown) {
    const arr = await this.select(table, filter);
    return Array.isArray(arr) ? (arr[0] || null) : arr;
  }

  async selectLast(table: string, filter: unknown) {
    const arr = await this.select(table, filter);
    return Array.isArray(arr) ? (arr[arr.length - 1] || null) : arr;
  }
}

export default InMemoryStorage;
