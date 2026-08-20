import { format } from 'date-fns'

function simulate(now, dow, createdAt, existingDates) {
  const year = now.getFullYear()
  const monthIdx = now.getMonth()
  const todayStr = format(now, 'yyyy-MM-dd')
  const createdOn = createdAt ? format(createdAt, 'yyyy-MM-dd') : '0000-01-01'
  const existing = new Set(existingDates)
  const out = []
  const first = new Date(year, monthIdx, 1)
  const offset = (dow - first.getDay() + 7) % 7
  let d = new Date(year, monthIdx, 1 + offset)
  while (d.getMonth() === monthIdx) {
    const occurred = format(d, 'yyyy-MM-dd')
    if (occurred > todayStr) break
    if (occurred >= createdOn && !existing.has(occurred)) out.push(occurred)
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
  }
  return out
}

// Caso 1: hoy 20 agosto 2026 (jueves), recurrente "lunes" (dow=1), creado hace tiempo, nada generado aun
console.log('Lunes en agosto 2026 hasta el 20:', simulate(new Date(2026,7,20), 1, new Date(2025,0,1), []))

// Caso 2: recurrente creado el 10 de agosto -> no debe generar el lunes 3
console.log('Lunes con created_at 10 ago:', simulate(new Date(2026,7,20), 1, new Date(2026,7,10), []))

// Caso 3: ya existe el 17 ago -> no debe duplicarlo, si generar el resto
console.log('Lunes con 17 ago ya existente:', simulate(new Date(2026,7,20), 1, new Date(2025,0,1), ['2026-08-17']))

// Caso 4: domingo (dow=0) en agosto 2026 hasta el 20
console.log('Domingos en agosto 2026 hasta el 20:', simulate(new Date(2026,7,20), 0, new Date(2025,0,1), []))
