export default function TagBubbles(tags: string[] | undefined) {
  if (tags === undefined) {
    return (<></>)
  }
  
  return (
    <div className="flex justify-center gap-4 mt-4 mb-2">
      {tags.map((tag) => (<div key={tag} className="outline outline-gray-500 rounded-lg outline-offset-4 text-sm">{tag}</div>))}
    </div>
  )
}
