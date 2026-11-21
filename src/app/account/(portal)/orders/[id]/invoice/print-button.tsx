"use client";

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-10 items-center rounded-full bg-flo-brown px-5 text-sm font-bold text-white"
    >
      Print invoice
    </button>
  );
}
