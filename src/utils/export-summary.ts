import type { Person } from '../types/commission'
import { calculateCommission, currency, getSalesTotal } from './commission'
import { formatWorkDate, todayInWorkTimeZone } from './history'

export function createSummaryImage(people: Person[], date: Date | string) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível criar a imagem.')

  const width = 1080
  canvas.width = width
  const font = (size: number, bold = false) => {
    ctx.font = `${bold ? 700 : 400} ${size}px Arial, sans-serif`
  }
  const wrapName = (name: string) => {
    font(30, true)
    const lines: string[] = []
    let line = ''
    for (const character of name.trim() || 'Sem nome') {
      if (ctx.measureText(line + character).width > 620 && line) {
        lines.push(line)
        line = ''
      }
      line += character
    }
    lines.push(line)
    return lines
  }
  const names = people.map((person) => wrapName(person.name))
  // Reserve the entire header before drawing any of the three detail columns.
  const headerHeights = names.map((lines) =>
    Math.max(116, 44 + (lines.length - 1) * 38 + 28),
  )
  const rowHeights = headerHeights.map((height) => height + 104)
  canvas.height = 500 + rowHeights.reduce((sum, height) => sum + height + 16, 0)

  const text = (
    value: string,
    x: number,
    y: number,
    size = 24,
    color = '#18211d',
    bold = false,
  ) => {
    font(size, bold)
    ctx.fillStyle = color
    ctx.fillText(value, x, y)
  }
  const fittedText = (
    value: string,
    x: number,
    y: number,
    maxWidth: number,
    size: number,
    color: string,
  ) => {
    font(size, true)
    while (ctx.measureText(value).width > maxWidth && size > 12)
      font(--size, true)
    text(value, x, y, size, color, true)
  }
  const card = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 20)
    ctx.fill()
  }

  ctx.fillStyle = '#f5f7f2'
  ctx.fillRect(0, 0, width, canvas.height)
  text('Comissão+', 56, 80, 32, '#196b4b', true)
  text('Resumo do dia', 56, 150, 48, '#18211d', true)
  text(
    formatWorkDate(typeof date === 'string' ? date : todayInWorkTimeZone(date)),
    56,
    192,
    26,
    '#68736d',
  )

  const totals = people.reduce(
    (sum, person) => ({
      sales: sum.sales + getSalesTotal(person),
      commissions: sum.commissions + calculateCommission(person).total,
    }),
    { sales: 0, commissions: 0 },
  )
  card(56, 230, 476, 130, '#196b4b')
  text('TOTAL VENDIDO', 80, 270, 20, '#ffffff')
  fittedText(currency.format(totals.sales), 80, 325, 428, 42, '#ffffff')
  card(548, 230, 476, 130, '#e5f3eb')
  text('TOTAL EM COMISSÕES', 572, 270, 20, '#196b4b')
  fittedText(currency.format(totals.commissions), 572, 325, 428, 42, '#196b4b')
  text(
    `Equipe · ${people.length} ${people.length === 1 ? 'pessoa' : 'pessoas'}`,
    56,
    410,
    26,
    '#18211d',
    true,
  )

  let y = 440
  people.forEach((person, index) => {
    const commission = calculateCommission(person)
    const height = rowHeights[index]
    const nameLines = names[index]
    card(56, y, 968, height, '#ffffff')
    const headerCenterY = y + headerHeights[index] / 2
    const nameStartY = headerCenterY - ((nameLines.length - 1) * 38) / 2
    ctx.textBaseline = 'middle'
    nameLines.forEach((line, lineIndex) =>
      text(line, 80, nameStartY + lineIndex * 38, 30, '#18211d', true),
    )
    text('GANHO TOTAL', 740, headerCenterY - 25, 18, '#68736d')
    fittedText(
      currency.format(commission.total),
      740,
      headerCenterY + 17,
      260,
      34,
      '#196b4b',
    )
    ctx.textBaseline = 'alphabetic'
    const detailTop = y + headerHeights[index]
    ctx.fillStyle = '#e5f3eb'
    ctx.fillRect(80, detailTop, 920, 2)
    const detailY = detailTop + 34
    text('Vendas', 80, detailY, 20, '#68736d')
    fittedText(
      currency.format(getSalesTotal(person)),
      80,
      detailY + 36,
      280,
      26,
      '#18211d',
    )
    text(
      `Comissão (${person.percentage.toLocaleString('pt-BR')}%)`,
      390,
      detailY,
      20,
      '#68736d',
    )
    fittedText(
      currency.format(commission.percentageAmount),
      390,
      detailY + 36,
      310,
      26,
      '#18211d',
    )
    text('Valor fixo', 740, detailY, 20, '#68736d')
    fittedText(
      currency.format(person.fixedAmount),
      740,
      detailY + 36,
      260,
      26,
      '#18211d',
    )
    y += height + 16
  })
  text(
    'Valores atuais da tela · Gerado pelo Comissão+',
    56,
    canvas.height - 24,
    20,
    '#68736d',
  )
  return canvas
}

export async function exportSummary(
  people: Person[],
  dateStamp = todayInWorkTimeZone(),
) {
  const canvas = createSummaryImage(people, dateStamp)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Não foi possível gerar o PNG.'))
    }, 'image/png')
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `commission-plus-resumo-${dateStamp}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
