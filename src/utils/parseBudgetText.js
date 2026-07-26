const parseNumber = (value) => {
  if (!value) return 0
  const digits = value.toString().replace(/[\_,\s円%]/g, '')
  return Number(digits) || 0
}

const splitColumns = (line) => {
  return line
    .split(/\t| {2,}/)
    .map((column) => column.trim())
    .filter(Boolean)
}

export const parseBudgetText = (text) => {
  const normalized = text
    .replace(/<\/(td|th|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00A0/g, ' ')

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const rows = []
  const fallback = []

  for (const line of lines) {
    if (/^(項目|金額|割合)$/u.test(line)) {
      continue
    }

    const columns = splitColumns(line)
    if (columns.length >= 3) {
      rows.push({
        item: columns[0],
        amount: parseNumber(columns[1]),
        ratio: columns[2],
      })
      continue
    }

    fallback.push(line)
  }

  if (rows.length > 0) {
    return rows
  }

  for (let i = 0; i + 2 < fallback.length; i += 3) {
    rows.push({
      item: fallback[i],
      amount: parseNumber(fallback[i + 1]),
      ratio: fallback[i + 2],
    })
  }

  return rows
}
