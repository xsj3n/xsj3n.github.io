import {promises as fs} from 'fs'
import path from "path"
import { fixedsys, fixedsysAlt } from './fonts'
import Link from 'next/link'

export default async function Posts() {
  const dirPath = path.join(process.cwd(), "src", "posts")
  const files = await fs.readdir(dirPath)

  if (!files.filter(fileName => !fileName.startsWith(".")).length) return (
    <div className="bg-secondary dark:bg-dark-secondary justify-center items-center flex flex-col h-2/5 m-2 p-2">
      <h2 className={`${fixedsysAlt.className } text-2xl whitespace-nowrap`}>-------x-------</h2>
      <h2 className={`${fixedsysAlt.className } text-2xl `}>Nothing here... yet.</h2>
      <h2 className={`${fixedsysAlt.className } text-2xl whitespace-nowrap`}>-------x-------</h2>
    </div>
  )
  
  const summaries  = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(path.join(dirPath, file), "utf8")
      return {
        name: file.split("_").join(" ").split(".")[0].toUpperCase(),
        rawName: file,
        date: content.split("---")[1],
        summary: content.split("---")[0]
      }
    })
  )
  
  return (
    <div className="flex flex-col h-full gap-2 p-2">
      
      {summaries.map(({name, rawName, date, summary}) => (
        <div key={name} className="bg-secondary dark:bg-dark-secondary flex flex-col place-items-center shadow max-h-2/5">
          
          <div className="flex flex-col text-center">
            <div className={`${fixedsys.className} text-2xl`}><Link href={`/blog/${rawName.split(".")[0]}`}>{name}</Link></div>
            <div className="text-sm">{date}</div>
            <div className="whitespace-nowrap">--------------------</div>
          </div>
          <p className="md:text-[0.92rem]  xs-font mr-10 mb-5 mt-5 ml-10">{summary}</p>
                    
        </div>
      ))}
    </div>
  )
}
