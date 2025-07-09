"use client"
import { useState, useEffect } from "react";
import { FaGithub, FaUser } from "react-icons/fa";
import { RiArrowDropDownLine } from "react-icons/ri";
import { FaXTwitter } from "react-icons/fa6";
import { fixedsysAlt } from "./fonts";
import TextScroll from "./scrolling";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LightSwitch from "./switch";


interface ChildProp {children: React.ReactNode}



interface BannerProps {className?: string}
function Banner({className}: BannerProps) {
  return (
    <div className={`h-[90px] bg-secondary dark:bg-dark-secondary dark:text-white ${className} shadow`} >
      <TextScroll text="----x----" className="justify-center flex" width="w-full" textReplications={12}/>
      <div className="flex justify-center gap-2">
        <Link href="/"><h2 className="font-bold mt-1">Netlink Shrine</h2></Link>
        <LightSwitch/>
      </div>
      <TextScroll text="----x----" className="justify-center flex" width="w-full" textReplications={12}/>  
    </div>
  )
}



interface aboutMeClassName { className?: string }
function AboutMe({className}: aboutMeClassName) {
   return (
    <div className={`bg-secondary dark:bg-dark-secondary transistion transistion-all duration-500 ease-out ${className} shadow`}>

      <div className="flex flex-col items-center">
        <p className={`${fixedsysAlt.className} text-2xl`}> About Me: </p>
        <Image src="/x_cr.jpg" width={76} height={76} alt="Profile Picture" className="rounded-full aspect-square object-cover border-2 border-black"/>
        <p className="p-3 md:text-[.88rem] abt-txt-resize xs-font">Hey, I'm Jin. My interests lie in operating systems, programming, networking, and the intersection of all these things within information security. Shameless NixOS shill.</p>
      </div>
      
      <div className="flex justify-between p-5">
        <div className="flex gap-1 items-center">
          <FaGithub/>
          <a href="https://github.com/xsj3n" className={fixedsysAlt.className}>Github</a>
        </div>
        <div className="flex gap-1 items-center">
          <FaXTwitter/>
          <a href="https://x.com/3n_jin" className={`${fixedsysAlt.className}`}>Twitter</a>
        </div>
      </div>
  
  
    </div>
  )
}


function MobileNav({children}: ChildProp) {
  const isRoot = usePathname() === "/" 
  
  const [isVisible, setIsVisible] = useState(false)
  const dropDownButton = (
    <div className="bg-secondary dark:bg-dark-secondary h-7 flex items-center justify-center mt-2 ml-2 mr-2 shadow" onClick={() => setIsVisible(!isVisible)}>
      <FaUser className="ml-2" size={20}/> <RiArrowDropDownLine className={`-ml-2 transform transistion-transform duration-500 ease-out ${isVisible ? "rotate-180" : "rotate-0"}`} size={30}/>
    </div>
  )
  
  return (
  <div className="w-full bg-background dark:bg-dark-background dark:text-white">
    <Banner/>
    { isRoot && dropDownButton}
    { isRoot && <AboutMe className={`${isVisible ? "opacity-100 max-h-2/5 p-2 ml-2 mr-2" : "opacity-0 max-h-0"} overflow-hidden shadow `}/>}
    {children}
  </div>)
}

function DesktopNav({children}: ChildProp) {
  const isRoot = usePathname() === "/"

  return (
  <div className="flex flex-col  w-full  items-center bg-background dark:bg-dark-background dark:text-white">
    <Banner className="shadow w-full"/>
    <div id="nav" className="w-7/8 h-full flex  h-full flex-col items-center">
      <div className="grid grid-cols-8 h-full w-full">
        {isRoot ? (
          <>
          <AboutMe className="mt-2 ml-2 col-span-2 h-110"/> 
          <div className="col-span-6">{children}</div>
          </>
        ) : (
          <div className="col-span-8 bg-secondary dark:bg-dark-secondary mt-2 mb-2 w-full">
            {children}
          </div>
        ) }
    </div>
    </div>
  </div>
  )
}


export default function Nav({children}: ChildProp) {
  
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 764)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, []);
  
  return (<>
    {isMobile ? (<MobileNav>{children}</MobileNav>)
              : (<DesktopNav>{children}</DesktopNav>)
    }
  </>)
}
