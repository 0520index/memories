import { extractUrls, shortenUrl } from '../lib/links'

type Props = {
  texts: (string | null | undefined)[]
  className?: string
}

export default function LinkButtons({ texts, className }: Props) {
  const urls = extractUrls(...texts)
  if (urls.length === 0) return null

  return (
    <div className={`link-buttons ${className ?? ''}`}>
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="link-chip"
          onClick={(e) => e.stopPropagation()}
        >
          🔗 {shortenUrl(url)}
        </a>
      ))}
    </div>
  )
}
