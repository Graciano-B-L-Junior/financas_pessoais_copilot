export function formatCurrency(value, currency = 'BRL', locale = 'pt-BR') {
  const amount = Number(value || 0)

  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

export function formatDate(value, locale = 'pt-BR') {
  if (!value) {
    return 'Sem data'
  }

  const parsedDate = new Date(`${value}T12:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

export function formatApiError(error, fallback = 'Nao foi possivel concluir a operacao.') {
  if (!error) {
    return fallback
  }

  if (typeof error === 'string') {
    return error
  }

  if (Array.isArray(error)) {
    return error.join(' ')
  }

  if (error.non_field_errors) {
    return formatApiError(error.non_field_errors, fallback)
  }

  const values = Object.values(error).reduce((items, current) => {
    if (Array.isArray(current)) {
      return items.concat(current)
    }

    return items.concat([current])
  }, [])

  const normalized = values
    .map((item) => {
      if (typeof item === 'string') {
        return item
      }

      return null
    })
    .filter(Boolean)

  return normalized.length ? normalized.join(' ') : fallback
}

export function getInitials(name = '') {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) {
    return 'FP'
  }

  return parts.map((part) => part[0].toUpperCase()).join('')
}