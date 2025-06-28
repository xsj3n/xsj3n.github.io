import path from "path";
import {promises as fs} from "fs";
import { fixedsysAlt } from "@/components/fonts";
import SyntaxHighlighter from "react-syntax-highlighter";
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import { Fragment } from "react";

export async function generateStaticParams() {
  const dirPath = path.join(process.cwd(), "src", "posts")
  const files = await fs.readdir(dirPath)

  if (!files.filter(fileName => !fileName.startsWith(".")).length) return [{blog: "not-found"}] 
  return files.map(fileName => ({blog: fileName.split(".")[0]}))
}


interface PostProps {
  params: Promise<{ blog: string }>
}

export default async function PostPage({params}: PostProps) {
  const blogParams = await params;
  const dirPath = path.join(process.cwd(), "src", "posts")
  const files = await fs.readdir(dirPath)
  const fileNameMatch = files.filter(fileName => fileName.split(".")[0] === blogParams.blog)

  if (!fileNameMatch.length) return (<div></div>)
  const fileName = fileNameMatch[0]
  const allContentSplit = (await fs.readFile(path.join(dirPath, fileName), "utf8")).split("---")
  let post = {
    date: allContentSplit[1],
    content: allContentSplit[2].trim().split(/\r?\n\r?\n+/),
    title: fileName.split("_").join(" ").split(".")[0].toUpperCase()
  }
  

  const formatted_content = post.content.map((paragraph) => {
    const matches = [...paragraph.matchAll(/```(.*?)```/gs)]
    if (!matches.length) return (
        <p className="mb-4">
          {paragraph}
        </p>
    )
  

    const language = matches[0][0].split(/```(.*)\n/)[1]
    return (
      <div className="mb-4 text-center w-full">
      <div>----------------</div>
      <SyntaxHighlighter language={language} style={docco} PreTag={({children}) => (
        <pre className="bg-secondary dark:bg-dark-secondary">
          {children}
        </pre>
      )}>
        {matches[0][1].split("\n")
                      .slice(1)
                      .join("\n")}
      </SyntaxHighlighter>
      <div>----------------</div>
      </div>
    )
        
  })

  
  
  return (
    <div className="dark:bg-dark-secondary flex flex-col mr-25 ml-25 mt-5 ">
      <div className="flex flex-col text-center mb-10 gap-2">
        <h1 className={`${fixedsysAlt.className} text-2xl`}>{post.title}</h1>
        <h3 className="font-bold">{post.date}</h3>
        <div>--------x--------</div>
      </div>
      {formatted_content.map((p, index) => (
        <Fragment key={index}>
          {p}
        </Fragment>
      ))}
    </div>
  )
}
