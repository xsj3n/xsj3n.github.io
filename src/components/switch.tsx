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

  function toggle() {
    classToggle()
    setIsDark(!isDark)
    window.dispatchEvent(new Event("theme-change"))
  }
  
  
  return (<div className="text-2xl" onClick={toggle}>☼</div>)
}
