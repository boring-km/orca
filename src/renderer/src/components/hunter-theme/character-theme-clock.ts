const weekdayFormat = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })
const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23'
})

export function characterThemeClockLabel(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}월 ${String(date.getDate()).padStart(2, '0')}일 (${weekdayFormat.format(date)}) ${timeFormat.format(date)}`
}
