import { daysTogether, formatDate, nextMilestones } from '../lib/date'

type Props = { anniversary: string | null; onSet: () => void }

export default function AnniversaryBanner({ anniversary, onSet }: Props) {
  if (!anniversary) {
    return (
      <button className="banner banner-empty" onClick={onSet}>
        付き合った日を設定すると、一緒に過ごした日数が表示されます
      </button>
    )
  }

  const days = daysTogether(anniversary)
  if (days < 1) {
    return <div className="banner">{formatDate(anniversary)} から始まります</div>
  }
  const { next100, daysTo100, years, daysToAnniv } = nextMilestones(anniversary)

  return (
    <div className="banner">
      <div className="banner-main">
        付き合って <strong>{days.toLocaleString()}</strong> 日目
      </div>
      <div className="banner-sub">
        <span>{next100.toLocaleString()}日記念まで あと{daysTo100}日</span>
        <span>
          {years}周年まで あと{daysToAnniv}日
        </span>
      </div>
    </div>
  )
}
