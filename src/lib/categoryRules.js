/**
 * Reglas heurísticas para sugerir categoría según la descripción del movimiento.
 * Las reglas se evalúan en orden — la primera que matchee gana.
 *
 * Devuelve el NOMBRE de la categoría (string) o null si no hay match.
 * El consumidor debe traducirlo al UUID de la categoría del usuario buscando
 * por nombre exacto (las default de Finanzor son: Vivienda, Ahorro, Comida,
 * Gimnasio, Salud, Caprichos, Transporte, Ocio, Otros).
 */
const RULES = [
  // === Comida ===
  { match: /mercadona|carrefour|lidl|aldi|consum|alcampo|hipercor|ahorram[aá]s|condis|caprabo/i, category: 'Comida' },
  { match: /\bdia\b|supermercado|fruter[ií]a|panader[ií]a|carnicer[ií]a/i, category: 'Comida' },
  { match: /restaur|burger|kfc|mcdonald|telepizza|domino|five guys|goiko|tacobell|subway|starbucks|vips/i, category: 'Comida' },
  { match: /cafe(t|ría)?|bar\s|cerveceria|panaderia/i, category: 'Comida' },

  // === Transporte ===
  { match: /gasoil|gasolin|repsol|cepsa|galp|shell|bp\s|petrolif/i, category: 'Transporte' },
  { match: /uber|cabify|bolt\s|free now|taxi/i, category: 'Transporte' },
  { match: /metro|emt|tmb\s|renfe|alsa|avlo|ouigo|iberia|vueling|ryanair/i, category: 'Transporte' },
  { match: /parking|aparcam|peaje|abertis|autopis/i, category: 'Transporte' },
  { match: /blablacar|car2go|emov|share\s*now/i, category: 'Transporte' },
  { match: /\bitv\b|taller|mecanico|neumat|revisi[oó]n coche/i, category: 'Transporte' },

  // === Vivienda ===
  { match: /alquiler|hipoteca|comunidad de prop|comunidad vecin/i, category: 'Vivienda' },
  { match: /iberdrola|naturgy|endesa|repsol energia|holaluz|totalenergies|edp\s/i, category: 'Vivienda' },
  { match: /aqualia|canal de isabel|emasesa|aguas de|hidraqua/i, category: 'Vivienda' },
  { match: /movistar|vodafone|orange|jazztel|masmovil|yoigo|pepephone|digi mobil|lowi|simyo|finetwork/i, category: 'Vivienda' },
  { match: /seguro hogar|mapfre hogar|mutua hogar/i, category: 'Vivienda' },

  // === Ocio ===
  { match: /netflix|spotify|hbo|disney\+|disney plus|amazon prime|appletv|apple tv|youtube premium|filmin|movistar plus|dazn/i, category: 'Ocio' },
  { match: /cine|cinesa|kinepolis|yelmo|teatro|concierto|festival|entradas|ticketmaster|fnac/i, category: 'Ocio' },
  { match: /steam|playstation|xbox|nintendo|battle.?net|epic games|riot|brawl|battlepass|battle.?pass/i, category: 'Ocio' },
  { match: /twitch|patreon|onlyfans/i, category: 'Ocio' },

  // === Gimnasio ===
  { match: /gimnasio|basic.?fit|altafit|mcfit|metropol|smart\s*fit|fitness\s*park|anytime\s*fitness|crossfit/i, category: 'Gimnasio' },
  { match: /\bgym\b/i, category: 'Gimnasio' },

  // === Salud ===
  { match: /farmacia|parafarmac/i, category: 'Salud' },
  { match: /m[eé]dico|cl[ií]nica|hospital|sanitas|adeslas|asisa|dkv|aegon|mapfre salud/i, category: 'Salud' },
  { match: /[oó]ptica|dentista|odont|psicolog/i, category: 'Salud' },

  // === Caprichos ===
  { match: /amazon|aliexpress|shein|temu|wallapop|vinted|ebay/i, category: 'Caprichos' },
  { match: /el corte ingl[eé]s|fnac|mediamarkt|worten|primark|zara|h&m|bershka|stradivarius|pull.?and.?bear|mango|c&a|kiabi/i, category: 'Caprichos' },
  { match: /peluquer[ií]a|barber|est[eé]tic|spa\s|cosm[eé]tic/i, category: 'Caprichos' },
  { match: /juguete|toy|hotwheels/i, category: 'Caprichos' },

  // === Ahorro (transferencias y aportaciones) ===
  { match: /aportaci[oó]n|plan.*pension|fondo.*invers|indexa|myinvestor|trade\s*republic|revolut.*ahorro/i, category: 'Ahorro' },
]

/**
 * Sugiere una categoría a partir de la descripción del movimiento.
 * Devuelve el nombre de la categoría o null si no hay match.
 */
export function suggestCategoryByDescription(description) {
  if (!description) return null
  const text = String(description).toLowerCase()
  for (const rule of RULES) {
    if (rule.match.test(text)) return rule.category
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────
// Reglas del usuario (tabla `category_rules`) y utilidades de texto.
// Las reglas del usuario se evalúan ANTES que las fijas de arriba.
// ─────────────────────────────────────────────────────────────────────

// Palabras que no identifican al comercio en un concepto bancario.
const NOISE = new Set([
  'compra', 'tarj', 'tarjeta', 'pago', 'pgo', 'recibo', 'bizum', 'transferencia',
  'transf', 'trf', 'cargo', 'adeudo', 'domiciliacion', 'comercio', 'tpv', 'pos',
  'sepa', 'visa', 'mastercard', 'www', 'com', 'net', 'org', 'con', 'del', 'los',
  'las', 'por', 'para', 'efectivo', 'reintegro', 'cajero', 'movil',
])

/** minúsculas y sin tildes: "Café Ñandú" -> "cafe nandu" */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Palabras "útiles" de un concepto: sin números, sin ruido bancario. */
export function meaningfulTokens(description) {
  return normalizeText(description)
    .replace(/[^a-z0-9&+]+/g, ' ')
    .split(' ')
    .filter((tok) => tok.length >= 3 && !/\d/.test(tok) && !NOISE.has(tok))
}

/**
 * Palabra clave sugerida para recordar un comercio:
 * "COMPRA TARJ. MERCADONA 0234" -> "mercadona". Null si no hay ninguna.
 */
export function extractKeyword(description) {
  return meaningfulTokens(description)[0] ?? null
}

/** Normaliza una palabra clave escrita por el usuario (2..60 caracteres). */
export function cleanKeyword(value) {
  const k = normalizeText(value).replace(/[^a-z0-9&+]+/g, ' ').trim()
  return k.length >= 2 && k.length <= 60 ? k : null
}

/**
 * Devuelve el category_id de la regla del usuario que encaja con la
 * descripción, o null. Se compara por palabras completas (la regla "dia"
 * NO encaja en "media") y gana la palabra clave más larga (más específica).
 */
export function matchUserRule(description, rules = []) {
  if (!description || rules.length === 0) return null
  const haystack = ` ${normalizeText(description).replace(/[^a-z0-9&+]+/g, ' ').trim()} `
  let best = null
  for (const rule of rules) {
    const kw = cleanKeyword(rule.keyword)
    if (!kw) continue
    if (haystack.includes(` ${kw} `) && (!best || kw.length > best.kwLength)) {
      best = { kwLength: kw.length, categoryId: rule.category_id }
    }
  }
  return best ? best.categoryId : null
}
