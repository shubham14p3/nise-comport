"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, FileDown, FileText, LockKeyhole, Pencil, X } from "lucide-react";
import "./voter-form8-modal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onReviewed?: () => void;
  onEdit?: () => void;
  children: React.ReactNode;
};

const PAGE_TITLES = ["Elector, request and residence", "Correction, replacement and declaration"];

export default function VoterForm8Modal({ open, onClose, onReviewed, onEdit, children }: Props) {
  const [page, setPage] = useState<1 | 2>(1);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const latestClose = useRef(onClose);
  latestClose.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); latestClose.current(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter(node => node.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  function changePage(next: 1 | 2) {
    setPage(next);
    viewportRef.current?.scrollTo({ top:0, left:0, behavior:"smooth" });
  }

  return <div className="f8-modal-backdrop" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <div className="f8-modal" ref={dialogRef} data-page={page} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="f8-modal__header">
        <div className="f8-modal__identity"><div className="f8-modal__icon"><FileText size={22}/></div><div>
          <span className="f8-modal__eyebrow"><Eye size={13}/> DOCUMENT VERIFICATION</span>
          <h2 id={titleId}>Voter Form 8 preview</h2>
          <p>Check every entered value against the elector&apos;s original documents.</p>
        </div></div>
        <button ref={closeRef} type="button" className="f8-modal__close" onClick={onClose} aria-label="Close Form 8 preview"><X size={22}/></button>
      </header>
      <nav className="f8-modal__toolbar" aria-label="Document pages">
        <div className="f8-modal__tabs">{PAGE_TITLES.map((label,index)=><button type="button" key={label}
          className={"f8-modal__tab"+(page===index+1?" is-active":"")} aria-current={page===index+1?"page":undefined}
          onClick={()=>changePage((index+1) as 1|2)}><b>Page {index+1}</b><small>{label}</small></button>)}</div>
        <span className="f8-modal__count">Page {page} of 2</span>
      </nav>
      <div className="f8-modal__viewport" ref={viewportRef} tabIndex={0} aria-label={"Form 8 page "+page}>
        <div className="f8-modal__paper">{children}</div>
      </div>
      <footer className="f8-modal__footer">
        <span className="f8-modal__security"><LockKeyhole size={15}/> Private draft · not an official ECI acknowledgement</span>
        <div className="f8-modal__footer-actions">
          <button type="button" className="f8-modal__secondary" onClick={()=>window.print()}><FileDown size={15}/> Save PDF</button>
          {onEdit && <button type="button" className="f8-modal__secondary" onClick={onEdit}><Pencil size={15}/> Edit details</button>}
          {page===1 ? <button type="button" className="f8-modal__primary" onClick={()=>changePage(2)}>Next page <ChevronRight size={16}/></button>
            : <><button type="button" className="f8-modal__secondary" onClick={()=>changePage(1)}><ChevronLeft size={15}/> Back</button>
              <button type="button" className="f8-modal__primary" onClick={()=>{onReviewed?.();onClose();}}><CheckCircle2 size={16}/> Done reviewing</button></>}
        </div>
      </footer>
    </div>
  </div>;
}
