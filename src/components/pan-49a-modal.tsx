"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, FileText, LockKeyhole, Pencil, X } from "lucide-react";
import type { PanIntake } from "@/lib/pan-validation";
import Pan49APreview from "@/components/pan-49a-preview";
import Pan93ExactPreview from "@/components/pan-93-exact-preview";
import "./pan-49a-modal.css";

type Props = {
  form93?: boolean;
  open: boolean;
  pan: PanIntake;
  answers: Record<string, string>;
  onClose: () => void;
  onEdit?: () => void;
};

const PAGE_TITLES = ["Applicant details & addresses", "Contact, proofs & declaration"];

export default function Pan49AModal({ open, pan, answers, onClose, onEdit, form93 = false }: Props) {
  const [page, setPage] = useState<1 | 2>(1);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;

  useEffect(() => {
    if (!open) return;
    const lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCallback.current();
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((node) => node.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      lastFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  const setVisiblePage = (newPage: 1 | 2) => {
    setPage(newPage);
    viewportRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <div
      className="pan49-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="pan49-modal"
        data-page={page}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="pan49-modal__header">
          <div className="pan49-modal__identity">
            <span className="pan49-modal__icon" aria-hidden="true"><FileText size={22}/></span>
            <div>
              <span className="pan49-modal__eyebrow"><Eye size={13}/> DOCUMENT VERIFICATION</span>
              <h2 id={titleId}>PAN Form {form93 ? "93" : "49A"} preview</h2>
              <p>Check how the entered information appears on the two-page form.</p>
            </div>
          </div>
          <button ref={closeRef} className="pan49-modal__close" type="button" onClick={onClose} aria-label="Close PAN form preview" title="Close preview"><X size={23}/></button>
        </div>
        <div className="pan49-modal__toolbar" aria-label="Form page navigation">
          <div className="pan49-modal__tabs" role="group" aria-label="Choose a form page">
            {PAGE_TITLES.map((label, index) => (
              <button
                type="button"
                className={page === index + 1 ? "pan49-modal__tab is-active" : "pan49-modal__tab"}
                aria-current={page === index + 1 ? "page" : undefined}
                key={label}
                onClick={() => setVisiblePage((index + 1) as 1 | 2)}
              >
                <span>Page {index + 1}</span><small>{label}</small>
              </button>
            ))}
          </div>
          <span className="pan49-modal__page-count">Page {page} of 2</span>
        </div>
        <div className="pan49-modal__viewport" ref={viewportRef} tabIndex={0} aria-label={"Preview of PAN form page " + page}>
          <div className="pan49-modal__paper">
            {form93 ? <Pan93ExactPreview answers={answers} pan={pan} onEdit={onEdit}/> : <Pan49APreview answers={answers} pan={pan} onEdit={onEdit}/>}
          </div>
        </div>
        <div className="pan49-modal__footer">
          <div className="pan49-modal__security"><LockKeyhole size={15} aria-hidden="true"/><span>Private verification · staff-only attachments and references are excluded</span></div>
          <div className="pan49-modal__footer-actions">
            {onEdit && <button type="button" className="pan49-modal__secondary" onClick={onEdit}><Pencil size={15}/> Edit details</button>}
            {page === 2
              ? <button type="button" className="pan49-modal__primary" onClick={onClose}><CheckCircle2 size={17}/> Done reviewing</button>
              : <button type="button" className="pan49-modal__primary" onClick={() => setVisiblePage(2)}>Next page <ChevronRight size={17}/></button>}
            {page === 2 && <button type="button" className="pan49-modal__back" onClick={() => setVisiblePage(1)}><ChevronLeft size={16}/> Back to page 1</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
