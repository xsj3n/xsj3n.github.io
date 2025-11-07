"use client"
import { useState } from "react"
import { Series } from "./posts"
import { fixedsys } from "./fonts"
import Link from "next/link"
import { RiArrowDropDownLine } from "react-icons/ri"


function TagBubbles(tags: string[] | undefined) {
  if (tags === undefined) {
    return (<></>)
  }
  
  return (
    <div className="flex justify-center gap-4 mt-4 mb-2">
      {tags.map((tag) => (<div key={tag} className="outline outline-(--background) rounded-lg outline-offset-4 text-sm">{tag}</div>))}
    </div>
  )
}

// the hyphe in the filename may be messing with the dynamic route, may have to adjust 
export default function SeriesDropdowns(props: Series & {className?: string}){ 
  const [isVisible, setIsVisble] = useState(false)
  const {seriesName, posts, seriesSummary, className} = props;
    
  return (
    <div className={`${className ?? ""}  flex flex-col place-items-center shadow`} >
      <div className="flex flex-col place-items-center bg-secondary dark:bg-dark-secondary">
        <div className="flex" onClick={() => setIsVisble(!isVisible)}>
          <div className={`${fixedsys.className} text-2xl`}>{seriesName}</div>
          <div><RiArrowDropDownLine size={35} className={`transform transistion-transform duration-500 ease-out ${isVisible ? "rotate-0" : "rotate-90"}`}/></div>
        </div>
        <div className="md:text-[0.92rem]  xs-font mr-10 mb-5 mt-5 ml-10">{seriesSummary}</div>
      </div>
      {posts.map(({name, date, rawName, summary, tags}) => (
        <div key={name} className={`${isVisible ? "opacity-100 max-h-4/5" : "opacity-0 max-h-0"} overflow-hidden bg-secondary dark:bg-dark-secondary flex flex-col place-items-center shadow max-h-2/5 transistion transistion-all duration-500 ease-out`}>
          <div className="flex flex-col text-center">
            <div className={`${fixedsys.className} text-2xl`}><Link href={`/blog/${rawName.split(".")[0]}`}>{name}</Link></div>

            <div className="text-sm">{date}</div>
            {TagBubbles(tags)}
            <div className="whitespace-nowrap">--------------------</div>
          </div>
          <p className="md:text-[0.92rem]  xs-font mr-10 mb-5 mt-5 ml-10">{summary}</p>
        </div> 
      ))}
    </div>
  )
}
