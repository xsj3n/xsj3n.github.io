"use client";
import { useEffect, useState } from "react";

function classToggle() {
  let theme = localStorage.getItem("theme")
  document.documentElement.classList.toggle("dark", theme == "dark")
  if (theme === "light") {
    localStorage.setItem("theme", "dark")
  } else {
    localStorage.setItem("theme", "light")
  }
} 

export default function LightSwitch() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      localStorage.setItem("theme", "dark")
      setIsDark(true)
    } else {
      localStorage.setItem("theme", "light")
    }
    classToggle()
  },[])

  function toggle() {
    classToggle()
    setIsDark(!isDark)
  }
  
  
  return (<div className="text-2xl" onClick={toggle}>☼</div>)
}
