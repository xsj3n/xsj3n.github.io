import React from "react";
import "./scrolling.css";


interface TextScrollProps {
  text: string,
  className?: string,
  width?: string,
  textReplications?: number
}
export default function TextScroll({text, className, width, textReplications}: TextScrollProps) {
  if (!width) width = "w-3/5"
  if (!textReplications) textReplications = 4
  const itemSet = Array.from({length: textReplications}).map((_, index) => (<React.Fragment key={`frag-${index}`}>
      <div key={index}>
        {text}
      </div>
      <div key={index + 10}>
        {text}
      </div>
      <div key={index + 100}>
        {text}
      </div>             
   </React.Fragment> ))
  const half = itemSet.length / 2
  return (
    <div className={`${className}`}>
    <div className={`${width} relative overflow-hidden flex gap-[1rem]`}>
      <div className="flex justify-around shrink-0 scroller w-max">
        {itemSet.slice(0, half)} 
      </div>
      <div className="flex justify-around shrink-0 scroller w-max">
        {itemSet.slice(half)}
      </div>
    </div>
  </div>
  )
}
