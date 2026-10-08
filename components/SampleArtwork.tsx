export function SampleArtwork({ title, index }: { title:string; index?:number }) {
  return <div className="sample-art" aria-label={`LA Tech Week: ${title}`}><span className="art-index" aria-hidden="true">{index?.toString().padStart(2,"0")}</span><strong>{title}</strong><small>LA Tech Week</small></div>;
}
