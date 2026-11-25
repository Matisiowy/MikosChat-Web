interface Props {
  text: string
  query: string
}

export default function SearchHighlight({
  text,
  query,
}: Props) {
  if (!query) return <>{text}</>

  const escaped = query.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  )

  const pattern = new RegExp(`(${escaped})`, 'giu')
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={index}
            className="bg-amber-400/25 text-amber-200 rounded-sm"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}
