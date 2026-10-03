import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCommissionPeople } from '../src/hooks/use-commission-people'
import { calculateCommission } from '../src/utils/commission'
import {
  isWorkDate,
  normalizeDailyPeople,
  shiftWorkDate,
  startDay,
  todayInWorkTimeZone,
} from '../src/utils/history'

const people = [
  {
    id: 'ana',
    name: 'Ana',
    percentage: 10,
    fixedAmount: 33.33,
    sales: [{ id: 'sale', amount: 100 }],
  },
]

describe('daily records', () => {
  it('uses the São Paulo calendar date around UTC midnight', () => {
    expect(todayInWorkTimeZone(new Date('2026-10-04T02:59:59Z'))).toBe(
      '2026-10-03',
    )
    expect(todayInWorkTimeZone(new Date('2026-10-04T03:00:00Z'))).toBe(
      '2026-10-04',
    )
  })

  it('validates real calendar dates and navigates month/year boundaries', () => {
    expect(isWorkDate('2026-02-29')).toBe(false)
    expect(isWorkDate('2024-02-29')).toBe(true)
    expect(isWorkDate('2026-13-01')).toBe(false)
    expect(isWorkDate('1899-12-31')).toBe(false)
    expect(shiftWorkDate('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftWorkDate('2024-03-01', -1)).toBe('2024-02-29')
  })

  it('copies team rules without sales and keeps previous records independent', () => {
    const nextDay = startDay(people)
    expect(nextDay[0].sales).toEqual([])
    const { result, unmount } = renderHook(() => useCommissionPeople(nextDay))
    act(() => result.current.updatePerson('ana', 'name', 'Ana Maria'))
    act(() => result.current.updatePerson('ana', 'percentage', '20'))
    act(() => result.current.removePerson('ana'))
    expect(result.current.people).toEqual([])
    expect(people[0].name).toBe('Ana')
    expect(calculateCommission(people[0]).total).toBe(43.33)
    unmount()
  })

  it('does not pay fixed amounts for an unstarted day', () => {
    const { result, unmount } = renderHook(() => useCommissionPeople([]))
    expect(result.current.summary).toEqual({ sales: 0, commissions: 0 })
    act(() => result.current.replacePeople(startDay(people)))
    expect(result.current.summary).toEqual({ sales: 0, commissions: 33.33 })
    unmount()
  })

  it('persists numeric amounts with two decimals and rejects invalid rules', () => {
    const draft = [
      {
        ...people[0],
        fixedAmount: 33.335,
        sales: [
          { id: 'sale', amount: '123.45' },
          { id: 'empty', amount: '.' },
        ],
      },
    ]
    expect(normalizeDailyPeople(draft)[0]).toMatchObject({
      fixedAmount: 33.34,
      sales: [
        { id: 'sale', amount: 123.45 },
        { id: 'empty', amount: 0 },
      ],
    })
    expect(() =>
      normalizeDailyPeople([{ ...people[0], percentage: 101 }]),
    ).toThrow('percentual')
    expect(() =>
      normalizeDailyPeople([{ ...people[0], fixedAmount: -1 }]),
    ).toThrow('valores')
    expect(() =>
      normalizeDailyPeople([{ ...people[0], fixedAmount: Infinity }]),
    ).toThrow('valores')
  })

  it('prevents fractional-cent sales so saved totals match the editor', () => {
    const { result, unmount } = renderHook(() => useCommissionPeople(people))
    act(() => result.current.updateSale('ana', 'sale', '0.005'))
    expect(result.current.people[0].sales[0].amount).toBe(100)
    act(() => result.current.updateSale('ana', 'sale', '0,01'))
    expect(result.current.summary.sales).toBe(0.01)
    unmount()
  })
})
