import path from "path";
import {promises as fs} from "fs";
import { fixedsysAlt } from "@/components/fonts";
import { cloneElement, Fragment, isValidElement, ReactElement } from "react";
import HighlightedCode from "@/components/highlight";

const pTagClassNames = "mb-3 sm:text-[.95rem] text-[0.90rem]"
export async function generateStaticParams() {
  const dirPath = path.join(process.cwd(), "src", "posts")
  const files = await fs.readdir(dirPath)

  if (!files.filter(fileName => !fileName.startsWith(".")).length) return [{blog: "not-found"}] 
  return files.map(fileName => ({blog: fileName.split(".")[0]}))
}

interface PostProps {
  params: Promise<{ blog: string }>
}


function tob64(str: string) {
  const utf8 = new TextEncoder().encode(str)
  let bin = ""
  utf8.forEach(byte => bin += String.fromCharCode(byte))
  return btoa(bin)
}

function fromb64(str: string) {
  const binary = atob(str);
  const bytes = new Uint8Array([...binary].map(char => char.charCodeAt(0)));
  return new TextDecoder().decode(bytes);
}

function toElement(paragraphs: string[]) {
  return paragraphs.map((paragraph) => {
    if (!paragraph.startsWith("$CODE$:")) return (
        <p className={pTagClassNames}>
          {paragraph}
        </p>
    )
    const codeSegment = paragraph.slice(7).slice(0,-3)

    const language = codeSegment.split("\n")[0].split("```")[1]
    // console.log("TO ELEMENT:\n" + codeSegment.split("\n").slice(1).join("\n"))
    return (
      <div className="mb-4">
      <div className="text-center mb-5">----------------</div>
      <HighlightedCode language={language}>{codeSegment.split("\n").slice(1).join("\n")}</HighlightedCode>
      <div className="text-center mt-5">----------------</div>
      </div>
    )
  })
}

function encodeCodeSegments(paragraphs: string) {
  return paragraphs.replaceAll(
    /```(.*?)```/gs,
    (match, _) => `~~~${tob64("$CODE$:" + match)}~~~`
  )
}

function decodeCodeSegments(paragraphs: string[]) {
  return paragraphs.map((paragraph) => {
    const codeMatch = paragraph.match(/~~~(.*?)~~~/s)
    if (!codeMatch) return paragraph
    const code = fromb64(
      codeMatch[0].slice(3, -3)
    )
    return code
  })
}

interface ParagraphProps {
  children: ReactElement<ParagraphProps>[] |  string
}

function insertBold(element: ReactElement<ParagraphProps>): ReactElement<ParagraphProps> {
  if (typeof element.props.children !== "string") return element
  
  const newChildren: ReactElement<ParagraphProps>[] = element.props.children.split(/(\*\*.*?\*\*)/g)
  .map((textPart, index) => {
    if (!textPart.startsWith("**")) return (<Fragment key={index}>{textPart}</Fragment>)
    return (<b key={index}>{textPart.slice(2, -2)}</b>)
  })
  
  if (newChildren.length === 1) return element
  return cloneElement(element, {}, newChildren)
} 

function insertSnippets(element: ReactElement<ParagraphProps>): ReactElement<ParagraphProps> {
  if (typeof element.props.children !== "string") return element
  
  const newChildren: ReactElement<ParagraphProps>[] = element.props.children.split(/(`.*?`)/g)
  .map((textPart, index) => {
    if (!textPart.startsWith("`")) return (<Fragment key={index}>{textPart}</Fragment>)
    return (<HighlightedCode key={index} language="inline">{textPart}</HighlightedCode>)
  })
  
  if (newChildren.length === 1) return element
  return cloneElement(element, {}, newChildren)
}

function insertLinks(element: ReactElement<ParagraphProps>): ReactElement<ParagraphProps> {
  if (typeof element.props.children !== "string") return element

  const text = element.props.children
  const newChildren: ReactElement<ParagraphProps>[] = []
  const textSplit = text.split(/(\[.*?\])(\(.*?\))/g)

  textSplit.forEach((textPart, index) => {
    
      if (!textPart.startsWith("(") && !textPart.startsWith("[")) newChildren.push(
        (<Fragment key={index}>{textPart}</Fragment>)
      ) 
      if (textPart.startsWith("[")) newChildren.push(
        (<a key={index} className="underline" href={textSplit[index + 1].slice(1, -1)}>{textPart.slice(1, -1)}</a>)
      )
    })
  return cloneElement(element, {}, newChildren)
}

function recurseModifyTree(
  elements: ReactElement<ParagraphProps>[],
  insertFn: (element: ReactElement<ParagraphProps>) => ReactElement<ParagraphProps>): ReactElement<ParagraphProps>[] {

  if (!Array.isArray(elements) || !elements.every((e) => isValidElement(e))) return elements
  
  const isStrChild = (element: ReactElement<ParagraphProps>) =>
    typeof element.props.children === "string"
  const isPTag     = (element: ReactElement<ParagraphProps>) =>
    element.type === "p"

  if (!elements.some(isPTag)) {

    let newChildren = []
    if (elements.every(isStrChild)) newChildren = elements.map((element) => insertFn(element))
    else  newChildren = recurseModifyTree(elements, insertFn)
     
    return [(
      <p className={pTagClassNames}>
        {newChildren}
      </p>
    )]
  }
  return elements.flatMap((element: ReactElement<ParagraphProps>) => {    
    if (!isValidElement(element) || element.type === "div") return element 
    if (typeof element.props.children === "string") return insertFn(element)

    return recurseModifyTree(element.props.children, insertFn)
  })
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
    content: allContentSplit[2],
    title: fileName.split("_").join(" ").split(".")[0].toUpperCase()
  }

  post.content                   = encodeCodeSegments(post.content)
  const contentParagraphs        = post.content.split(/\n\n/)
  const decodedContentParagraphs = decodeCodeSegments(contentParagraphs)
  const reactElementParagraphs   = toElement(decodedContentParagraphs)
  const boldElements             = recurseModifyTree(reactElementParagraphs,insertBold)
  const highlightedElements      = recurseModifyTree(boldElements, insertSnippets)
  const linkedElements           = recurseModifyTree(highlightedElements, insertLinks)
  
  return (
    <div className="dark:bg-dark-secondary bg-secondary flex flex-col pr-10 pl-10 pt-5 sm:ml-15 sm:mr-15 ml-2 mr-2 mt-5">
      <div className="flex flex-col text-center mb-10 gap-2">
        <h1 className={`${fixedsysAlt.className} text-2xl`}>{post.title}</h1>
        <h3 className="font-bold">{post.date}</h3>
        <div>--------x--------</div>
      </div>  
       {linkedElements.map((children, index) =>
         (<Fragment key={index}>{children}</Fragment>))
       }
    </div>
  )
}
