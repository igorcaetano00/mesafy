import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import '../styles/landing.css'

// ===== Configuração comercial (um lugar só) =====
const PRECO_MES = 149.9
const PRECO_ANO = 1199
const LINK_MENSAL = 'https://www.asaas.com/000/c/s2zixj3vfwpkoyf7'
const LINK_ANUAL = 'https://www.asaas.com/000/c/cdkuyf36tv3frp5d'
const WHATSAPP_MESAFY = '5527997679086' // TODO: trocar pelo número comercial do Mesafy
const DEMO = '/jhonnys-garage'

const fmt = (v) => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const zap = (msg) => `https://wa.me/${WHATSAPP_MESAFY}?text=${encodeURIComponent(msg)}`

function Phone() {
  return (
    <div className="phone" aria-hidden="true"><div className="scr">
      <div className="ph-hero"><div className="t">Jhonny's<span>Garage</span></div></div>
      <div className="ph-tabs"><i className="on">Lanches</i><i>Petiscos</i><i>Carnes</i><i>Drinks</i><i>Cervejas</i></div>
      <div className="ph-item in"><div><b>Ozzy</b><small>Duplo blend, bacon, banana, coalho e mel</small></div><span className="pr">R$ 50</span><span className="q">2</span></div>
      <div className="ph-item"><div><b>Smash Duplo</b><small>Duplo blend, duplo cheddar, bacon</small></div><span className="pr">R$ 36</span><span className="q">+</span></div>
      <div className="ph-item"><div><b>Bolinho de Costela</b><small>8 unidades</small></div><span className="pr">R$ 55</span><span className="q">+</span></div>
      <div className="ph-item"><div><b>Heineken 600ml</b><small>Sempre trincando</small></div><span className="pr">R$ 16</span><span className="q">+</span></div>
      <div className="ph-cart"><span>2 itens · Ver pedido</span><b>R$ 100,00</b></div>
    </div></div>
  )
}

export default function Home() {
  const [plano, setPlano] = useState('anual')
  const qr = useRef()
  useEffect(() => {
    document.title = 'Mesafy | Cardápio digital com pedido no WhatsApp'
    if (qr.current) QRCode.toCanvas(qr.current, window.location.origin + DEMO, { width: 150, margin: 1, color: { dark: '#141111', light: '#ffffff' } })
  }, [])
  const link = plano === 'anual' ? LINK_ANUAL : LINK_MENSAL

  return (
    <div className="lp">
      <header className="lp-nav"><div className="wrap">
        <a className="lp-logo" href="#topo">Mesa<em>fy</em></a>
        <nav>
          <a href="#como" className="hide">Como funciona</a>
          <a href="#recursos" className="hide">Recursos</a>
          <a href="#preco">Preço</a>
          <Link to="/login">Entrar</Link>
          <a className="btn" href={DEMO} target="_blank" rel="noopener">Ver demo</a>
        </nav>
      </div></header>

      <section className="lp-hero" id="topo"><div className="wrap">
        <div>
          <div className="eyebrow">Para bares, lanchonetes e restaurantes</div>
          <h1>Cardápio no QR Code. Pedido direto no <em>WhatsApp</em>. Sem comissão.</h1>
          <p className="lead">O cliente aponta a câmera, escolhe e envia o pedido. Ele cai no seu WhatsApp e no painel da cozinha ao mesmo tempo. Você paga um valor fixo por mês, não uma porcentagem de cada venda.</p>
          <div className="ctas">
            <a className="btn big" href="#preco">Quero no meu estabelecimento</a>
            <a className="btn big ghost" href={DEMO} target="_blank" rel="noopener">Ver cardápio de exemplo</a>
          </div>
          <div className="proof"><span><b>0%</b> de comissão</span><span><b>Sem</b> app para baixar</span><span><b>Pronto</b> em 1 dia</span></div>
        </div>
        <Phone />
      </div></section>

      <section className="pain"><div className="wrap">
        <div className="eyebrow">O problema</div>
        <h2>Você já paga caro por pedido. <em>Só não vê</em>.</h2>
        <div className="cards">
          <div className="card"><h3>Comissão de marketplace</h3><p>De 12% a 27% em cada pedido. Num mês de R$ 20 mil, são até R$ 5.400 que saem do seu caixa para o aplicativo.</p></div>
          <div className="card"><h3>Pedido anotado errado</h3><p>Garçom anota, cozinha interpreta, cliente reclama. Cada erro é prato refeito, tempo perdido e cliente que não volta.</p></div>
          <div className="card"><h3>Cardápio de papel desatualizado</h3><p>Mudou o preço, acabou o item, lançou o prato novo. Reimprimir custa caro e o cliente descobre na hora de pagar.</p></div>
        </div>
      </div></section>

      <section className="alt" id="como"><div className="wrap">
        <div className="eyebrow">Como funciona</div>
        <h2>Três passos. <em>Nenhuma tecnologia</em> para o cliente aprender.</h2>
        <div className="cards">
          <div className="card"><div className="n">1</div><h3>QR Code na mesa</h3><p>Você imprime o QR que o painel gera. Cola na mesa, no balcão ou no cardápio físico.</p></div>
          <div className="card"><div className="n">2</div><h3>Cliente escolhe e envia</h3><p>Abre o cardápio no navegador, com foto e preço. Informa nome e mesa. Toca em enviar e o WhatsApp abre com o pedido pronto.</p></div>
          <div className="card"><div className="n">3</div><h3>Pedido na cozinha</h3><p>Chega no seu WhatsApp e no painel de pedidos ao mesmo tempo, com som. Aceitar, preparar, pronto, entregue.</p></div>
        </div>
      </div></section>

      <section id="recursos"><div className="wrap">
        <div className="eyebrow">O que está incluso</div>
        <h2>Tudo que um estabelecimento <em>precisa</em>. Nada que não precisa.</h2>
        <div className="cards six">
          {[
            ['Cardápio digital com a sua cara', 'Cor, foto de capa e fotos dos pratos. Fica com a identidade do seu negócio, não com a de um aplicativo.'],
            ['Pedido pelo WhatsApp', 'Nome, mesa, celular e itens chegam formatados. Sem precisar de API paga ou número especial.'],
            ['Painel de pedidos em tempo real', 'Tela para o balcão ou a cozinha, com som a cada pedido novo. Funciona em tablet, celular ou computador.'],
            ['Edição na hora', 'Mudou o preço ou acabou o item? Altera no painel e o cliente já vê. Marque "esgotado" com um toque.'],
            ['Fotos geradas por IA', 'Não tem foto profissional? A gente gera imagens dos seus pratos para o cardápio ficar vendedor.'],
            ['Relatórios e clientes', 'Mais vendidos, faturamento por dia, ticket médio e lista automática de clientes com celular.'],
          ].map(([t, d]) => (
            <div className="card" key={t}><div className="ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg></div><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </div></section>

      <section className="alt lp-demo"><div className="wrap">
        <div>
          <div className="eyebrow">Veja funcionando</div>
          <h2>Jhonny's Garage, <em>São Domingos do Norte</em></h2>
          <p className="lead">Lanchonete e petiscaria do interior do Espírito Santo, primeiro cliente do Mesafy. Aponte a câmera ou toque no botão e faça um pedido de teste.</p>
          <div className="ctas" style={{ marginTop: 18 }}><a className="btn big" href={DEMO} target="_blank" rel="noopener">Abrir cardápio de exemplo</a></div>
        </div>
        <div className="qr"><canvas ref={qr} /><small>Aponte a câmera</small></div>
      </div></section>

      <section className="lp-price" id="preco"><div className="wrap">
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow">Preço único</div>
          <h2>Um plano. <em>Tudo incluso</em>. Cancele quando quiser.</h2>
          <p className="lead" style={{ margin: '12px auto 0' }}>Menos do que você paga de comissão em dois ou três pedidos por dia.</p>
        </div>
        <div className="box">
          <div className="plans">
            <button type="button" className={'plan' + (plano === 'mensal' ? ' on' : '')} onClick={() => setPlano('mensal')}>
              <div className="l">Mensal</div><div className="v">{fmt(PRECO_MES)}<small> /mês</small></div>
            </button>
            <button type="button" className={'plan' + (plano === 'anual' ? ' on' : '')} onClick={() => setPlano('anual')}>
              <div className="l">Anual</div><div className="v">{fmt(PRECO_ANO)}<small> /ano</small></div><span className="tag">2 meses grátis + domínio próprio</span>
            </button>
          </div>
          <ul>
            <li>Cardápio digital + QR Code</li>
            <li>Pedido pelo WhatsApp</li>
            <li>Painel de pedidos em tempo real (cozinha e balcão)</li>
            <li>Painel para editar itens, preços e fotos</li>
            <li>Fotos dos pratos geradas por IA</li>
            <li>Relatório de mais vendidos e clientes</li>
            <li>Montagem do cardápio inclusa: manda foto do cardápio atual e a gente sobe</li>
            <li>Suporte pelo WhatsApp</li>
          </ul>
          <a className="btn big" href={link} target="_blank" rel="noopener" style={{ width: '100%' }}>
            {plano === 'anual' ? `Assinar anual por ${fmt(PRECO_ANO)}` : `Assinar mensal por ${fmt(PRECO_MES)}`}
          </a>
          <p className="fine">Pix, boleto ou cartão. Sem fidelidade no mensal. Depois do pagamento você recebe o acesso ao painel no mesmo dia.</p>
        </div>
      </div></section>

      <section className="alt"><div className="wrap">
        <div className="eyebrow">Comparativo</div>
        <h2>Faça a <em>conta</em>.</h2>
        <div className="tbl-wrap"><table>
          <thead><tr><th></th><th>Papel + anotação</th><th>Marketplace</th><th className="me">Mesafy</th></tr></thead>
          <tbody>
            <tr><td>Custo em R$ 20 mil/mês de vendas</td><td>Reimpressão e erro de pedido</td><td>R$ 2.400 a R$ 5.400</td><td className="me">R$ 149,90</td></tr>
            <tr><td>Cliente precisa baixar app</td><td>Não</td><td>Sim</td><td className="me">Não</td></tr>
            <tr><td>Contato do cliente fica com você</td><td>Não</td><td>Não</td><td className="me">Sim, no seu WhatsApp</td></tr>
            <tr><td>Mudar preço ou item</td><td>Reimprimir</td><td>Pelo app deles</td><td className="me">Na hora, no seu painel</td></tr>
            <tr><td>Identidade visual</td><td>A sua</td><td>A deles</td><td className="me">A sua</td></tr>
          </tbody>
        </table></div>
      </div></section>

      <section><div className="wrap">
        <div className="eyebrow">Perguntas frequentes</div>
        <h2>O que todo dono <em>pergunta</em>.</h2>
        <div style={{ marginTop: 20 }}>
          <details><summary>Preciso de WhatsApp Business ou número novo?</summary><p>Não. Funciona com o WhatsApp que você já usa. O pedido chega como uma mensagem normal do cliente. Se quiser organizar com etiquetas, o WhatsApp Business gratuito ajuda, mas não é obrigatório.</p></details>
          <details><summary>Meu cliente precisa instalar alguma coisa?</summary><p>Não. O QR abre o cardápio no navegador do celular. O único aplicativo envolvido é o WhatsApp, que ele já tem.</p></details>
          <details><summary>Quem monta o cardápio?</summary><p>A gente. Você manda foto ou PDF do cardápio atual e em até um dia útil ele está no ar. Depois, você mesmo edita pelo painel quando quiser.</p></details>
          <details><summary>Funciona para delivery?</summary><p>Hoje o foco é pedido na mesa e retirada no balcão. Delivery com taxa por bairro está em desenvolvimento e entra sem custo extra para quem já assina.</p></details>
          <details><summary>E se eu quiser cancelar?</summary><p>No plano mensal, cancela a qualquer momento e o cardápio fica no ar até o fim do período pago. No anual, o valor é o de 10 meses, com 2 de bônus.</p></details>
          <details><summary>Tem taxa por pedido?</summary><p>Nenhuma. O valor é fixo, independente de quantos pedidos você receber.</p></details>
        </div>
      </div></section>

      <section className="lp-final alt"><div className="wrap">
        <div className="eyebrow">Comece hoje</div>
        <h2>Seu cardápio no ar <em>amanhã</em>.</h2>
        <p className="lead" style={{ margin: '12px auto 0' }}>Assine, mande o cardápio atual pelo WhatsApp e receba o QR Code pronto para imprimir.</p>
        <div className="ctas">
          <a className="btn big" href="#preco">Assinar o Mesafy</a>
          <a className="btn big ghost" href={zap('Olá! Quero saber mais sobre o Mesafy para o meu estabelecimento.')} target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>
        </div>
      </div></section>

      <footer className="lp-foot"><div className="wrap">
        <span>Mesafy · Cardápio digital com pedido pelo WhatsApp</span>
        <span>Espírito Santo, Brasil · <Link to="/login">Área do cliente</Link></span>
      </div></footer>
    </div>
  )
}
