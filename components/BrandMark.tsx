import Image from "next/image";
import { assetUrl } from "@/lib/assets";
export function BrandMark(){return <span className="brand-lockup"><Image className="brand-symbol" src={assetUrl("/brand/productai-logo-light.svg")} width={154} height={19} alt="Product.ai"/><small>LINEUP</small></span>}
