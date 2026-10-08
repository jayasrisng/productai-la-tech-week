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

export const POSTER_SIZE={width:1080,height:1350,margin:72,contentTop:280,contentBottom:1260} as const;

// Measure again at each candidate font size: wrapping changes as type shrinks.
export function fitPosterLayout(groups:{day:string;names:string[]}[],measure:(text:string,fontSize:number)=>number){
  const available=POSTER_SIZE.contentBottom-POSTER_SIZE.contentTop;
  const layoutAt=(fontSize:number)=>{
    const lineHeight=fontSize*1.28,eventGap=fontSize*.42,dateFontSize=fontSize*.8,dateGap=fontSize*.75,groupGap=fontSize*.9;
    const maxWidth=POSTER_SIZE.width-POSTER_SIZE.margin*2;
    const laidOut=groups.map(group=>{
      const runs:{text:string;x:number;line:number;eventIndex:number|null}[]=[];
      let x=0,line=0;
      const add=(text:string,eventIndex:number|null)=>{
        const parts=wrapPosterText(text,t=>measure(t,fontSize),maxWidth);
        parts.forEach((part,index)=>{
          const gap=x?measure(" ",fontSize):0;
          if(index>0||x+gap+measure(part,fontSize)>maxWidth){x=0;line++;}
          if(x)x+=measure(" ",fontSize);
          runs.push({text:part,x,line,eventIndex});x+=measure(part,fontSize);
        });
      };
      group.names.forEach((name,eventIndex)=>{
        if(eventIndex)add("◆",null);
        name.trim().split(/\s+/).forEach(word=>add(word,eventIndex));
      });
      return {...group,runs,lineCount:runs.length?line+1:0,lines:group.names.map(name=>wrapPosterText(name,text=>measure(text,fontSize),maxWidth))};
    });
    const height=laidOut.reduce((total,group)=>total+dateFontSize+dateGap+groupGap+group.lineCount*lineHeight,0);
    return {fontSize,lineHeight,eventGap,dateFontSize,dateGap,groupGap,groups:laidOut,height};
  };
  let low=0,high=48;
  for(let i=0;i<40;i++){
    const middle=(low+high)/2;
    if(layoutAt(middle).height<=available)low=middle;else high=middle;
  }
  return layoutAt(low);
}
