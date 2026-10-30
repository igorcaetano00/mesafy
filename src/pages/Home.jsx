import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import '../styles/landing.css'

// ===== Configuração comercial (um lugar só) =====
const PRECO_MES = 149.9
const PRECO_ANO = 1199
const LINK_MENSAL = 'https://www.asaas.com/000/c/s2zixj3vfwpkoyf7'
const LINK_ANUAL = 'https://www.asaas.com/000/c/cdkuyf36tv3frp5d'
const WHATSAPP = '5527998816621' // Igor Caetano, criador do Garçom Online
const DEMO = '/jhonnys-garage'
const IMG = 'https://xdmfgvvsawlfyqldbvjx.supabase.co/storage/v1/object/public/fotos/mesafy/'

const brl = (v, dec = 2) => 'R$ ' + v.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const zap = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`

const ZapIcon = () => <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.1.6 2.8.5a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.5-.3z" /></svg>

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

function Calc() {
  const [fat, setFat] = useState(20000)
  const [pct, setPct] = useState(20)
  const comissao = fat * pct / 100
  const economia = comissao - PRECO_MES
  return (
    <div className="calc">
      <div style={{ display: 'grid', gap: 22 }}>
        <label className="f">Quanto você vende por mês pelo aplicativo
          <div className="val">{brl(fat, 0)}</div>
          <input id="c-fat" type="range" min="3000" max="100000" step="1000" value={fat} onChange={e => setFat(+e.target.value)} />
        </label>
        <label className="f">Comissão que o aplicativo cobra
          <div className="val">{pct}%</div>
          <input id="c-pct" type="range" min="10" max="30" step="1" value={pct} onChange={e => setPct(+e.target.value)} />
        </label>
      </div>
      <div className="out">
        <div className="row bad"><span>Você paga de comissão</span><b>{brl(comissao, 0)}/mês</b></div>
        <div className="row"><span>Garçom Online</span><b>{brl(PRECO_MES)}/mês</b></div>
        <div className="row hi"><span>Fica no seu caixa</span><b>{economia > 0 ? brl(economia, 0) : brl(0, 0)}/mês</b></div>
        <div className="row"><span>Em um ano</span><b>{brl(Math.max(0, economia * 12), 0)}</b></div>
      </div>
    </div>
  )
}

export default function Home() {
  const [plano, setPlano] = useState('anual')
  const qr = useRef()
  useEffect(() => {
    document.title = 'Garçom Online | Cardápio digital com pedido no WhatsApp, sem comissão'
    if (qr.current) QRCode.toCanvas(qr.current, window.location.origin + DEMO, { width: 150, margin: 1, color: { dark: '#141111', light: '#ffffff' } })
  }, [])
  const link = plano === 'anual' ? LINK_ANUAL : LINK_MENSAL

  return (
    <div className="lp">
      <header className="lp-nav"><div className="wrap">
        <a className="lp-logo" href="#topo" aria-label="Garçom Online">Garçom <em>Online</em></a>
        <nav>
          <a href="#como" className="hide">Como funciona</a>
          <a href="#conta" className="hide">Faça a conta</a>
          <a href="#preco">Preço</a>
          <Link to="/login" className="hide">Entrar</Link>
          <a className="btn" href="#preco">Assinar</a>
        </nav>
      </div></header>

      <section className="lp-hero" id="topo"><div className="bg" /><div className="wrap">
        <div>
          <div className="eyebrow">Para bares, lanchonetes e restaurantes</div>
          <h1>Pare de pagar <em>comissão</em> em cada pedido.</h1>
          <p className="lead">Cardápio digital no QR Code da mesa. O cliente escolhe no celular e o pedido cai no seu WhatsApp e na cozinha, na hora. Valor fixo por mês. Zero por pedido.</p>
          <div className="ctas">
            <a className="btn big glow" href="#preco">Quero no meu estabelecimento</a>
            <a className="btn big ghost" href={DEMO} target="_blank" rel="noopener">Testar o cardápio de exemplo</a>
          </div>
          <div className="stats">
            <div className="stat"><b>0%</b><span>de comissão</span></div>
            <div className="stat"><b>1 dia</b><span>para estar no ar</span></div>
            <div className="stat"><b>R$ 0</b><span>por pedido</span></div>
          </div>
        </div>
        <Phone />
      </div></section>

      <div className="lp-proof"><div className="wrap">
        <span>Em operação em <b>São Domingos do Norte, ES</b></span>
        <span>Funciona com o <b>WhatsApp que você já usa</b></span>
        <span>Cliente <b>não instala nada</b></span>
        <span>Pix, boleto ou cartão</span>
      </div></div>

      <section><div className="wrap">
        <div className="eyebrow">A conta que ninguém faz</div>
        <h2>Todo pedido pelo aplicativo sai <em>mais caro</em> do que parece.</h2>
        <div className="pain">
          <div className="card"><div className="v">12% a 27%</div><h3>De comissão por pedido</h3><p>Em R$ 20 mil de vendas no mês, são R$ 2.400 a R$ 5.400 que saem do seu caixa direto para o aplicativo.</p></div>
          <div className="card"><div className="v">0</div><h3>Contatos que ficam com você</h3><p>O cliente é do aplicativo, não seu. Você não tem o celular dele para avisar da promoção de quinta.</p></div>
          <div className="card"><div className="v">1 em 10</div><h3>Pedidos anotados errado</h3><p>Garçom anota, cozinha interpreta, cliente reclama. Prato refeito é custo que não aparece no caixa, mas sai do lucro.</p></div>
        </div>
      </div></section>

      <section className="alt" id="conta"><div className="wrap">
        <div className="eyebrow">Faça a sua conta</div>
        <h2>Quanto o Garçom Online deixa <em>no seu caixa</em>?</h2>
        <p className="lead">Arraste e veja. A comissão vai embora, o valor fixo fica.</p>
        <Calc />
      </div></section>

      <section id="como"><div className="wrap">
        <div className="eyebrow">Como funciona</div>
        <h2>Três passos. <em>Nada</em> para o cliente aprender.</h2>
        <div className="split" style={{ marginTop: 28 }}>
          <img src={IMG + 'lp-celular.jpg'} alt="Cliente escolhendo no cardápio digital pelo celular" loading="lazy" />
          <ul>
            <li><span className="dot">1</span><div><b>QR Code na mesa</b><span>Você imprime o QR que o painel gera. Cola na mesa, no balcão, no cardápio físico.</span></div></li>
            <li><span className="dot">2</span><div><b>Cliente escolhe e envia</b><span>Abre no navegador, com foto e preço. Informa nome e mesa, toca em enviar. O WhatsApp abre com o pedido pronto.</span></div></li>
            <li><span className="dot">3</span><div><b>Pedido na cozinha</b><span>Chega no seu WhatsApp e no painel ao mesmo tempo, com som. Aceitar, preparar, pronto, entregue.</span></div></li>
          </ul>
        </div>
      </div></section>

      <section className="alt"><div className="wrap">
        <div className="split rev">
          <img src={IMG + 'lp-dono.jpg'} alt="Dono de bar com o painel de pedidos no tablet" loading="lazy" />
          <div>
            <div className="eyebrow">Painel do dono</div>
            <h2>Você vê tudo. <em>Sem depender</em> de ninguém.</h2>
            <ul>
              <li><span className="dot">✓</span><div><b>Pedidos em tempo real</b><span>Tela para o balcão ou a cozinha. Toca um som a cada pedido novo.</span></div></li>
              <li><span className="dot">✓</span><div><b>Mudou o preço? Muda na hora</b><span>Acabou o item? Marca "esgotado" com um toque e some do cardápio.</span></div></li>
              <li><span className="dot">✓</span><div><b>Mais vendidos e clientes</b><span>Faturamento por dia, ticket médio e a lista de quem pediu, com celular.</span></div></li>
              <li><span className="dot">✓</span><div><b>Fotos geradas por IA</b><span>Não tem foto profissional? A gente gera imagens dos seus pratos.</span></div></li>
            </ul>
          </div>
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="eyebrow">Primeiro cliente</div>
        <div className="case">
          <div>
            <h2>Jhonny's Garage, <em>São Domingos do Norte</em></h2>
            <blockquote>Lanchonete e petiscaria do interior do Espírito Santo, com cardápio de 110 itens no ar em um dia. Aponte a câmera e faça um pedido de teste agora.</blockquote>
            <div className="who"><b>Cardápio de demonstração</b> · pedidos de teste são bem-vindos</div>
            <div style={{ marginTop: 20 }}><a className="btn big" href={DEMO} target="_blank" rel="noopener">Abrir o cardápio</a></div>
          </div>
          <div className="qr"><canvas ref={qr} /><small>Aponte a câmera</small></div>
        </div>
      </div></section>

      <section className="lp-price alt" id="preco"><div className="wrap">
        <div className="lp-center">
          <div className="eyebrow">Preço único</div>
          <h2>Um plano. <em>Tudo incluso</em>.</h2>
          <p className="lead">Menos do que a comissão de três pedidos por dia.</p>
        </div>
        <div className="box">
          <div className="plans">
            <button type="button" className={'plan' + (plano === 'mensal' ? ' on' : '')} onClick={() => setPlano('mensal')}>
              <div className="l">Mensal</div><div className="v">{brl(PRECO_MES)}<small> /mês</small></div><div className="eq">Sem fidelidade</div>
            </button>
            <button type="button" className={'plan' + (plano === 'anual' ? ' on' : '')} onClick={() => setPlano('anual')}>
              <span className="tag">Mais escolhido</span>
              <div className="l">Anual</div><div className="v">{brl(PRECO_ANO)}<small> /ano</small></div><div className="eq">Sai por {brl(PRECO_ANO / 12)}/mês · 2 meses grátis</div>
            </button>
          </div>
          <ul>
            <li>Cardápio digital com a sua identidade + QR Code</li>
            <li>Pedido pelo WhatsApp, sem taxa por pedido</li>
            <li>Painel de pedidos em tempo real (cozinha e balcão)</li>
            <li>Painel para editar itens, preços, fotos e "esgotado"</li>
            <li>Fotos dos pratos geradas por IA</li>
            <li>Relatórios: mais vendidos, faturamento, clientes</li>
            <li>Montagem do cardápio inclusa: manda foto ou PDF e a gente sobe</li>
            <li>Suporte direto no WhatsApp com quem criou o sistema</li>
            {plano === 'anual' && <li>Domínio próprio (ex.: cardapiodoseubar.com.br)</li>}
          </ul>
          <a className="btn big glow" href={link} target="_blank" rel="noopener" style={{ width: '100%' }}>
            {plano === 'anual' ? `Assinar anual por ${brl(PRECO_ANO)}` : `Assinar mensal por ${brl(PRECO_MES)}`}
          </a>
          <div className="guar"><span style={{ fontSize: 26 }}>🛡️</span><div><b>Sem risco</b>Não gostou em 7 dias? Devolvemos o valor. Sem pergunta, sem burocracia.</div></div>
          <p className="fine">Pix, boleto ou cartão. Acesso ao painel no mesmo dia do pagamento.</p>
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="eyebrow">Comparativo</div>
        <h2>Papel, aplicativo ou <em>Garçom Online</em>?</h2>
        <div className="tbl-wrap"><table>
          <thead><tr><th></th><th>Papel + anotação</th><th>Marketplace</th><th className="me">Garçom Online</th></tr></thead>
          <tbody>
            <tr><td>Custo em R$ 20 mil/mês de vendas</td><td>Reimpressão e erro de pedido</td><td>R$ 2.400 a R$ 5.400</td><td className="me">R$ 149,90</td></tr>
            <tr><td>Cliente precisa baixar app</td><td>Não</td><td>Sim</td><td className="me">Não</td></tr>
            <tr><td>Contato do cliente fica com você</td><td>Não</td><td>Não</td><td className="me">Sim, no seu WhatsApp</td></tr>
            <tr><td>Mudar preço ou item</td><td>Reimprimir</td><td>Pelo app deles</td><td className="me">Na hora, no seu painel</td></tr>
            <tr><td>Identidade visual</td><td>A sua</td><td>A deles</td><td className="me">A sua</td></tr>
            <tr><td>Pedido chega na cozinha</td><td>Pelo garçom</td><td>Pela impressora deles</td><td className="me">Painel em tempo real</td></tr>
          </tbody>
        </table></div>
      </div></section>

      <section className="alt"><div className="wrap">
        <div className="eyebrow">Perguntas frequentes</div>
        <h2>O que todo dono <em>pergunta</em>.</h2>
        <div style={{ marginTop: 20 }}>
          <details><summary>Preciso de WhatsApp Business ou número novo?</summary><p>Não. Funciona com o WhatsApp que você já usa. O pedido chega como uma mensagem normal. Se quiser organizar com etiquetas, o WhatsApp Business gratuito ajuda, mas não é obrigatório.</p></details>
          <details><summary>Meu cliente precisa instalar alguma coisa?</summary><p>Não. O QR abre o cardápio no navegador do celular. O único aplicativo envolvido é o WhatsApp, que ele já tem.</p></details>
          <details><summary>Quem monta o cardápio?</summary><p>A gente. Você manda foto ou PDF do cardápio atual e em até um dia útil ele está no ar. Depois, você mesmo edita pelo painel quando quiser.</p></details>
          <details><summary>Funciona para delivery?</summary><p>Hoje o foco é pedido na mesa e retirada no balcão. Delivery com taxa por bairro está em desenvolvimento e entra sem custo extra para quem já assina.</p></details>
          <details><summary>Tem taxa por pedido ou por mesa?</summary><p>Nenhuma. O valor é fixo, independente de quantos pedidos, mesas ou itens você tiver.</p></details>
          <details><summary>E se eu quiser cancelar?</summary><p>No mensal, cancela a qualquer momento e o cardápio fica no ar até o fim do período pago. No anual, você paga 10 meses e usa 12.</p></details>
          <details><summary>Quem está por trás do Garçom Online?</summary><p>Igor Caetano, profissional de marketing e negócios do Espírito Santo. O suporte é feito por ele, no WhatsApp, sem robô e sem fila.</p></details>
        </div>
        <div className="maker">
          <div className="av">IC</div>
          <div>
            <div className="nm">Igor Caetano · criador do Garçom Online</div>
            <p>Criei o Garçom Online depois de ver quanto um bar do interior perde em comissão e pedido errado. Qualquer dúvida, me chama direto. Respondo pessoalmente.</p>
            <div style={{ marginTop: 10 }}><a className="btn ghost" href={zap('Olá Igor! Vi o site do Garçom Online e quero saber mais para o meu estabelecimento.')} target="_blank" rel="noopener">Falar com o Igor no WhatsApp</a></div>
          </div>
        </div>
      </div></section>

      <section className="lp-final"><div className="bg" /><div className="wrap">
        <div className="eyebrow">Comece hoje</div>
        <h2>Seu cardápio no ar <em>amanhã</em>.</h2>
        <p className="lead" style={{ marginInline: 'auto' }}>Assine, mande o cardápio atual pelo WhatsApp e receba o QR Code pronto para imprimir.</p>
        <div className="ctas">
          <a className="btn big glow" href="#preco">Assinar o Garçom Online</a>
          <a className="btn big ghost" href={zap('Olá Igor! Quero tirar uma dúvida sobre o Garçom Online.')} target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>
        </div>
      </div></section>

      <footer className="lp-foot"><div className="wrap">
        <span>Garçom Online · garcononline.com.br</span>
        <span>Espírito Santo, Brasil · <Link to="/login">Área do cliente</Link></span>
      </div></footer>

      <a className="lp-zap" href={zap('Olá Igor! Vi o site do Garçom Online e quero saber mais.')} target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><ZapIcon />WhatsApp</a>
    </div>
  )
}
