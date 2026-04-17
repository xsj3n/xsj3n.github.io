"use client"
import { useState } from "react"
import { Series } from "./posts"
import { fixedsys } from "./fonts"
import { RiArrowDropDownLine } from "react-icons/ri"
import SinglePost from "@/components/single_posts"

// the hyphe in the filename may be messing with the dynamic route, may have to adjust 
export default function SeriesDropdowns(props: Series & {className?: string}){ 
  const [isVisible, setIsVisble] = useState(false)
  const {seriesName, posts, seriesSummary, className} = props;
    
  return (
    <div className={`${className ?? ""}  flex flex-col place-items-center shadow`} >
      <div className="pl-2 flex flex-col place-items-center bg-dark-secondary">
        <div className="flex" onClick={() => setIsVisble(!isVisible)}>
          <div className={`${fixedsys.className} text-xl md:text-2xl text-center`}>{seriesName}</div>
          <div><RiArrowDropDownLine size={35} className={`transform transistion-transform duration-500 ease-out ${isVisible ? "rotate-0" : "rotate-90"}`}/></div>
        </div>
        <div className="md:text-[0.92rem] text-sm mr-10 mb-5 mt-5 ml-10">{seriesSummary}</div>
      </div>
      {posts.map(({name, date, rawName, summary, tags}) => (
           <SinglePost key={name} name={name} date={date} rawName={rawName} summary={summary} tags={tags} isVisible={isVisible} visibleModEnabled={true}/>
      ))}
    </div>
  )
}
