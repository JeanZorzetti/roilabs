'use client';

export default function PrintButton() {
  return (
    <button className="btn btn--sm" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>
      Imprimir / salvar PDF
    </button>
  );
}
