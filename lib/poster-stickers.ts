// Full-strength colors approved in David’s Oct 6 handoff.
export const posterStickers=[{glyph:"★",color:"#8B5CF6"},{glyph:"ϟ",color:"#38BDF8"},{glyph:"♡",color:"#02BB64"},{glyph:"✿",color:"#FBBF24"},{glyph:"✳",color:"#FB923C"},{glyph:":)",color:"#EF4444"},{glyph:"↗",color:"#F472B6"},{glyph:"◈",color:"#8B5CF6"}];
export function posterStickerColor(glyph:string,color:string){
  // Keep saved placements; map old white/tinted stickers onto the approved palette.
  return posterStickers.find(item=>item.color===color.toUpperCase())?.color??posterStickers.find(item=>item.glyph===glyph)?.color??"#8B5CF6";
}
