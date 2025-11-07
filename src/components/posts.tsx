import {promises as fs} from 'fs'
import path from "path"
import { fixedsys, fixedsysAlt } from './fonts'
import Link from 'next/link'
import SeriesDropdowns from './series_dropdown'

export type Summary = {
  name: string,
  rawName: string,
  date: string,
  part: number,
  summary: string,
  tags?: string[]
}

export type Series = {
  seriesName: string,
  seriesSummary: string,
  posts: Summary[]
}

function toDisplayName(fileName: string) {
  return fileName.split("_")
    .join(" ")
    .split("-")[0]
    .toUpperCase()
}

const seriesSums = []
const macSummary = "MACC|Here is my summary type of thing"
seriesSums.push(macSummary)

export default async function Posts() {
  const postDirRoot = path.join(process.cwd(), "src", "posts")
  const allSoloPostingFilenames = await fs.readdir(path.join(postDirRoot, "solo_posts"))
  const allSeriesDirNames = (await fs.readdir(postDirRoot))
    .filter((dirName) => dirName !== "solo_posts")
  

  // TODO: check for no series OR solo postings
  if (!allSeriesDirNames.filter(fileName => !fileName.startsWith(".")).length) return (
    <div className="bg-secondary dark:bg-dark-secondary justify-center items-center flex flex-col h-2/5 m-2 p-2">
      <h2 className={`${fixedsysAlt.className } text-2xl whitespace-nowrap`}>-------x-------</h2>
      <h2 className={`${fixedsysAlt.className } text-2xl `}>Nothing here... yet.</h2>
      <h2 className={`${fixedsysAlt.className } text-2xl whitespace-nowrap`}>-------x-------</h2>
    </div>
  )
  const allSolo: Summary[] = await Promise.all(
    allSoloPostingFilenames.map( async (fileName) => {
      const contentSplit = (await fs.readFile(path.join(postDirRoot, "solo_posts", fileName), "utf8")).split("---")
      return {
        name: toDisplayName(fileName),
        rawName: fileName,
        date: contentSplit[1],
        part: -1, // -1 for solo postings
        summary: contentSplit[0]
      }
    })
  )
  const allSeries: Series[] = await Promise.all(
    allSeriesDirNames.map(async (dirName) => {
      const seriesDirRoot = path.join(postDirRoot, dirName)
      const fileNames = await fs.readdir(seriesDirRoot)
      const summaryIndex = fileNames.indexOf("summary.md")
      const summaryFileContent = await fs.readFile(path.join(seriesDirRoot, fileNames[summaryIndex]), "utf8")
      fileNames.splice(summaryIndex, 1)
      return {
        seriesName: dirName.replaceAll("_", " ").toUpperCase(),
        seriesSummary: summaryFileContent,
        posts: await Promise.all(fileNames.map(async (fileName) => {
          const contentSplit = (await fs.readFile(path.join(seriesDirRoot, fileName), "utf8")).split("---")
          return {
            name: fileName.split("_").join(" ").split("-")[0].toUpperCase(),
            rawName: fileName,
            date: contentSplit[1].split("|")[0],
            part: Number(fileName.split("-")[1].split(".")[0].split("_")[1]),
            summary: contentSplit[0],
            tags: contentSplit[1].split("|")[1].split(",")
          }
        }))
      }
    }))
  
  
  
  const soloPostings = (
    <>
      {allSolo.map(({name, rawName, part,  date, summary}) => (
        <div key={name} className="bg-secondary dark:bg-dark-secondary flex flex-col place-items-center shadow">
          
          <div className="flex flex-col text-center">
            <div className={`${fixedsys.className} text-2xl`}><Link href={`/blog/${rawName.split(".")[0]}`}>{name}</Link></div>
            <div className="text-sm">{date}</div>
            <div className="whitespace-nowrap">--------------------</div>
          </div>
          <p className="md:text-[0.92rem]  xs-font mr-10 mb-5 mt-5 ml-10">{summary}</p>
                    
        </div>
      ))}
    </>)

  return (
    <div className="flex flex-col gap-2 p-2">
      {allSeries.map(({seriesName, seriesSummary, posts}) => (
        <SeriesDropdowns key={seriesName} seriesName={seriesName} seriesSummary={seriesSummary} posts={posts} className="gap-4"></SeriesDropdowns>
      ))}
    </div>
  )
}
