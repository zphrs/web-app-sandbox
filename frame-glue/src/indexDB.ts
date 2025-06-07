async function clearIdb() {
  const dbs = await window.indexedDB.databases()
  await Promise.all(
    dbs.map(db => db.name && window.indexedDB.deleteDatabase(db.name))
  )
}

export async function overrideIndexDB() {
  await clearIdb()
}
