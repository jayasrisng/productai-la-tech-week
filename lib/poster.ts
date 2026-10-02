// Wrap to the actual canvas font width, including single words longer than a line.
export function wrapPosterText(text:string, measure:(text:string)=>number, maxWidth:number):string[]{
  const lines:string[]=[];
  let line="";
  for(const word of text.trim().split(/\s+/)){
    const candidate=line?`${line} ${word}`:word;
    if(measure(candidate)<=maxWidth){line=candidate;continue;}
    if(line){lines.push(line);line="";}
    for(const character of word){
      if(line&&measure(line+character)>maxWidth){lines.push(line);line="";}
      line+=character;
    }
  }
  if(line)lines.push(line);
  return lines;
}
