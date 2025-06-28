import Posts from "@/components/posts";
import path from "path";


export default async function Home() {
    const dirPath = path.join(process.cwd(), "src", "posts");
    const files = await fs.readdir(dirPath);
    const summaries = await Promise.all(
        files.map(async (file) => {
            const content = await fs.readFile(path.join(dirPath, file), "utf8");
            return {
                name: file.split("_").join(" ").split(".")[0].toUpperCase(),
                date: content.split("---")[1],
                summary: content.split("---")[0]
            };
        })
    );


    return (
        <Posts />
    );
}
