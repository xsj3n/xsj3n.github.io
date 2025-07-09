"use client"
import { ReactElement, useEffect, useState } from "react";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter"
import { coyWithoutShadows as lightTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { nightOwl as darkTheme } from "react-syntax-highlighter/dist/esm/styles/prism";

interface innerChild {
  children: string
}
export interface childrenProps {
  language: string
  children: string | ReactElement<innerChild>[]
}

export default function HighlightedCode({language, children} : childrenProps) {
  let strChild = ""
  if (typeof children !== "string") strChild = children[0].props.children
  else strChild = children
  
  const [isDark, setIsDark] = useState(false)
    useEffect(() => {
      const updateTheme = () => setIsDark(document.documentElement.classList.contains("dark"))
      window.addEventListener("theme-change", updateTheme)
      updateTheme()
      return () => window.removeEventListener("theme-change", updateTheme)
    }, [])

  if (language === "inline") return (
     <em className="pr-[3px] pl-[3px]" style={{
      color: "rgb(127, 219, 202)",
      backgroundColor: isDark ? "#3d3c3d" : "#6d6969"
    }}>
      {strChild.slice(1, -1)}
    </em>
    )
    

  return (
    <SyntaxHighlighter language={language} style={isDark ? darkTheme : lightTheme } PreTag={({children})  => (
      <pre className="bg-secondary dark:bg-dark-secondary overflow-auto">
        {children}
      </pre>
    )}>
    {strChild}
    </SyntaxHighlighter>
  )
}
