"use client"
import { useState, useEffect } from "react";


function queryScreen() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  });
  
  return isMobile
}

const classCommons = "bg-secondary"
function MobileNav() {
  return (
    <>
      <div className={`h-[8vh] text-center`} >
        Mobile
      </div>
      <div className="grid grid-col-1 gap-1 text-center bg-secondary">
        {Array.from({length: 4}, (_, i) => i).map((num) =>
          <div key={num}>Option {num}</div>
        )}
      </div>
   </>
  )
}

function DesktopNav() {
  return (
    <div className={`${classCommons}`} >
      Desktop
    </div>
  )
}

export default function Nav() {
  const isMobile = queryScreen()
  return (<> {isMobile ? MobileNav() : DesktopNav()} </>)
}
