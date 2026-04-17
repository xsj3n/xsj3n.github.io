"use client"
import { fixedsys } from "./fonts"
import Link from "next/link"
import TagBubbles from "@/components/tag_bubbles"

export interface SinglePostProps {
  name: string,
  rawName: string,
  date: string,
  summary: string,
  tags: string[] | undefined,
  isVisible: boolean,
  visibleModEnabled: boolean
}

export default function SinglePost({name, date, rawName, summary, tags, isVisible, visibleModEnabled}: SinglePostProps) {
  let visibilityMod = ""
  if (visibleModEnabled) {
    visibilityMod = isVisible ? "opacity-100 max-h-4/5" : "opacity-0 max-h-0"
  }
  return (
    <div key={name} className={`${visibilityMod} overflow-hidden bg-dark-secondary flex flex-col place-items-center shadow max-h-2/5 transistion transistion-all duration-500 ease-out`}>
      <div className="flex flex-col text-center">
        <div className={`${fixedsys.className} text-xl md:text-2xl`}><Link href={`/blog/${rawName.split(".")[0]}`}>{name}</Link></div>

        <div className="text-sm">{date}</div>
        {TagBubbles(tags)}
        <div className="whitespace-nowrap">--------------------</div>
      </div>
      <p className="text-left md:text-[0.92rem]  text-sm mr-10 mb-5 mt-5 ml-10">{summary}</p>
    </div> 
  )
}
