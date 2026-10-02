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

export const POSTER_SIZE={width:1080,height:1350,margin:72,contentTop:360,contentBottom:1260} as const;

// Measure again at each candidate font size: wrapping changes as type shrinks.
export function fitPosterLayout(groups:{day:string;names:string[]}[],measure:(text:string,fontSize:number)=>number){
  const available=POSTER_SIZE.contentBottom-POSTER_SIZE.contentTop;
  const layoutAt=(fontSize:number)=>{
    const lineHeight=fontSize*1.28,eventGap=fontSize*.42,dateFontSize=fontSize*.8,dateGap=fontSize*.75,groupGap=fontSize*.9;
    const laidOut=groups.map(group=>({...group,lines:group.names.map(name=>wrapPosterText(name,text=>measure(text,fontSize),POSTER_SIZE.width-POSTER_SIZE.margin*2))}));
    const height=laidOut.reduce((total,group)=>total+dateFontSize+dateGap+groupGap+group.lines.reduce((sum,lines)=>sum+lines.length*lineHeight+eventGap,0),0);
    return {fontSize,lineHeight,eventGap,dateFontSize,dateGap,groupGap,groups:laidOut,height};
  };
  let low=0,high=48;
  for(let i=0;i<40;i++){
    const middle=(low+high)/2;
    if(layoutAt(middle).height<=available)low=middle;else high=middle;
  }
  return layoutAt(low);
}
