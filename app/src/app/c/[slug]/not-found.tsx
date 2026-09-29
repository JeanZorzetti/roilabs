import { waLink } from '@/lib/wa';

// Link errado ou contrato excluído. Não diz qual dos dois, nem cita nenhum outro contrato.
export default function ContratoNaoEncontrado() {
  return (
    <div className="prop">
      <header className="prop-capa prop-capa--cheia">
        <div className="prop-wrap">
          <p className="prop-marca">
            ROI Labs <span>Contrato</span>
          </p>
          <h1>Contrato não encontrado</h1>
          <p className="prop-lead">
            O link pode estar incompleto, ou o contrato foi retirado. Fale com a ROI Labs para receber o link certo.
          </p>
          <a className="prop-cta" href={waLink('5562993265713', 'Olá! Tentei abrir um contrato da ROI Labs e o link não funcionou.')}>
            Falar com a ROI Labs no WhatsApp
          </a>
        </div>
      </header>
    </div>
  );
}
