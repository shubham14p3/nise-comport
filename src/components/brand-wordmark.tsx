import Image from "next/image";

export default function BrandWordmark({ caption = "A Move Towards Digital India e-Gov Services" }: { caption?: string }) {
  return <span className="brand-lockup"><Image className="brand-logo-image" src="/images/logo/logo-footer.png" alt="NISE COMPORT" width={220} height={41} priority /><small>{caption}</small></span>;
}
