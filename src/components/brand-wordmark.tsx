/** Text wordmark keeps the trademark casing exact in every language. */
export default function BrandWordmark({ caption = "A Move Towards Digital India e-Gov Services" }: { caption?: string }) {
  return <span className="brand-lockup"><strong className="brand-wordmark-text">NiSE COMPORT</strong><small>{caption}</small></span>;
}
