import Image from "next/image";
import { assetUrl } from "@/lib/assets";
export function BrandMark(){return <span className="brand-lockup"><Image className="brand-symbol" src={assetUrl("/brand/productai-logo-white.png")} width={154} height={27} alt="Product.ai"/><small>TECH WEEK</small></span>}
