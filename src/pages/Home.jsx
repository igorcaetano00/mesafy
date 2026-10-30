import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import '../styles/landing.css'

// ===== Configuração comercial (um lugar só) =====
const PRECO_MES = 149.9
const PRECO_ANO = 1199
const LINK_MENSAL = 'https://www.asaas.com/000/c/s2zixj3vfwpkoyf7'
const LINK_ANUAL = 'https://www.asaas.com/000/c/cdkuyf36tv3frp5d'
const WHATSAPP = '5527998816621' // Igor Caetano, criador da FOODPORN
const DEMO = '/jhonnys-garage'
const IMG = 'https://xdmfgvvsawlfyqldbvjx.supabase.co/storage/v1/object/public/fotos/mesafy/'
const HM = 'https://hotmart.com/pt-br/marketplace/produtos/'

// ===== E-books FOODPORN (Hotmart) =====
const MANUAL = {
  code: 'K105427792U', titulo: 'Manual Completo FOODPORN', sub: 'O guia definitivo do negócio de comida que fatura',
  preco: 97, de: 197, slug: 'manual-completo-foodporn-o-guia-definitivo-do-negocio-de-comida-que-fatura',
}
const EBOOKS = [
  { code: 'K105427005E', tema: 'Foto', titulo: 'A Foto que Vende', sub: 'Fotografar comida para vender mais, só com o celular', slug: 'a-foto-que-vende-como-fotografar-comida-para-vender-mais-mesmo-usando-so-o-celular' },
  { code: 'W105427281C', tema: 'Foto', titulo: 'A Foto Perfeita', sub: 'Guia completo de fotografia de alimentos com celular', slug: 'a-foto-perfeita-o-guia-completo-de-fotografia-de-alimentos-com-celular' },
  { code: 'U105427617Y', tema: 'Cardápio', titulo: 'Cardápio que Dá Água na Boca', sub: 'Como escrever um cardápio que vende sozinho', slug: 'cardapio-que-da-agua-na-boca-como-escrever-um-cardapio-que-vende-sozinho' },
  { code: 'N105427649X', tema: 'Vendas', titulo: 'Marketing para Delivery', sub: 'Lotar o delivery sem depender só do iFood', slug: 'marketing-para-delivery-como-lotar-seu-delivery-sem-depender-so-do-ifood' },
  { code: 'P105427668Q', tema: 'Marca', titulo: 'Posicionamento de Marca', sub: 'Como sair da guerra de preço', slug: 'posicionamento-de-marca-para-restaurantes-como-sair-da-guerra-de-preco' },
  { code: 'O105427688B', tema: 'Vendas', titulo: 'Atendimento que Vende', sub: 'Sua equipe vendendo como time de alta performance', slug: 'atendimento-que-vende-como-transformar-sua-equipe-em-vendedores-de-alta-performance' },
  { code: 'X105427715W', tema: 'Conteúdo', titulo: 'Instagram para Restaurantes', sub: 'Transformar seguidor em cliente', slug: 'instagram-para-restaurantes-o-guia-completo-para-transformar-seguidor-em-cliente' },
  { code: 'I105427732X', tema: 'Marca', titulo: 'Valorize e Cobre Melhor', sub: 'Aumentar preços sem perder clientes', slug: 'valorize-e-cobre-melhor-como-aumentar-seus-precos-sem-perder-clientes' },
  { code: 'W105427748V', tema: 'Conteúdo', titulo: 'Conteúdo que Dá Fome', sub: 'Posts que geram pedido imediato', slug: 'conteudo-que-da-fome-como-criar-posts-que-geram-pedido-imediato' },
  { code: 'G105427766G', tema: 'Marca', titulo: 'Comida Simples em Produto Desejado', sub: 'Transformar o comum em premium', slug: 'comida-simples-em-produto-desejado-como-transformar-o-comum-em-premium' },
]
const TEMAS = ['Todos', 'Foto', 'Cardápio', 'Vendas', 'Marca', 'Conteúdo']
const hm = (e) => `${HM}${e.slug}/${e.code}`

const brl = (v, dec = 2) => 'R$ ' + v.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const zap = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`

const ZapIcon = () => <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2.1.6 2.8.5a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.5-.3z" /></svg>
const BookIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5a2.5 2.5 0 0 0 0 5H20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>

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
  const [tema, setTema] = useState('Todos')
  const qr = useRef()
  useEffect(() => {
    document.title = 'FOODPORN | Cardápio digital com pedido no WhatsApp e e-books para negócios de comida'
    if (qr.current) QRCode.toCanvas(qr.current, window.location.origin + DEMO, { width: 150, margin: 1, color: { dark: '#141111', light: '#ffffff' } })
  }, [])
  const link = plano === 'anual' ? LINK_ANUAL : LINK_MENSAL
  const lista = tema === 'Todos' ? EBOOKS : EBOOKS.filter(e => e.tema === tema)

  return (
    <div className="lp">
      <header className="lp-nav"><div className="wrap">
        <a className="lp-logo" href="#topo" aria-label="FOODPORN"><img src="/fp/logo.webp" alt="" width="34" height="34" /><span>FOODPORN</span></a>
        <nav>
          <a href="#menu" className="hide">Cardápio digital</a>
          <a href="#preco" className="hide">Preço</a>
          <a href="#ebooks" className="nav-ebooks"><BookIcon />E-books</a>
          <Link to="/login" className="hide">Entrar</Link>
          <a className="btn" href="#preco">Assinar</a>
        </nav>
      </div></header>

      <section className="lp-hero" id="topo"><div className="bg" /><div className="wrap">
        <div>
          <div className="eyebrow">FOODPORN Menu · cardápio digital</div>
          <h1>Cardápio que dá fome. Pedido que cai no <em>WhatsApp</em>.</h1>
          <p className="lead">QR Code na mesa, fotos que vendem e o pedido direto no seu WhatsApp e na cozinha, na hora. Valor fixo por mês, zero comissão por pedido.</p>
          <div className="ctas">
            <a className="btn big glow" href="#preco">Quero no meu negócio</a>
            <a className="btn big ghost" href={DEMO} target="_blank" rel="noopener">Ver um cardápio em operação</a>
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

      <section className="lp-doors"><div className="wrap">
        <div className="lp-center">
          <div className="eyebrow">Uma marca, duas frentes</div>
          <h2>Tudo o que faz <em>comida vender</em>.</h2>
          <p className="lead">A FOODPORN nasceu da fotografia e do marketing de comida. Hoje entrega a ferramenta e o conhecimento.</p>
        </div>
        <div className="doors">
          <a className="door" href="#menu">
            <span className="tag">Ferramenta</span>
            <h3>FOODPORN Menu</h3>
            <p>Cardápio digital no QR Code com pedido pelo WhatsApp, painel da cozinha em tempo real e fotos por IA. Sem comissão.</p>
            <span className="go">A partir de {brl(PRECO_ANO / 12)}/mês →</span>
          </a>
          <a className="door alt" href="#ebooks">
            <span className="tag">Conhecimento</span>
            <h3>E-books FOODPORN</h3>
            <p>Foto, cardápio, delivery, Instagram, preço e posicionamento. Guias práticos para quem vive de comida.</p>
            <span className="go">A partir de R$ 37 →</span>
            <div className="covers" aria-hidden="true">
              {['K105427005E', 'U105427617Y', 'I105427732X'].map(c => <img key={c} src={`/fp/${c}.webp`} alt="" loading="lazy" />)}
            </div>
          </a>
        </div>
      </div></section>

      <section className="alt"><div className="wrap">
        <div className="eyebrow">A conta que ninguém faz</div>
        <h2>Todo pedido pelo aplicativo sai <em>mais caro</em> do que parece.</h2>
        <div className="pain">
          <div className="card"><div className="v">12% a 27%</div><h3>De comissão por pedido</h3><p>Em R$ 20 mil de vendas no mês, são R$ 2.400 a R$ 5.400 que saem do seu caixa direto para o aplicativo.</p></div>
          <div className="card"><div className="v">0</div><h3>Contatos que ficam com você</h3><p>O cliente é do aplicativo, não seu. Você não tem o celular dele para avisar da promoção de quinta.</p></div>
          <div className="card"><div className="v">1 em 10</div><h3>Pedidos anotados errado</h3><p>Garçom anota, cozinha interpreta, cliente reclama. Prato refeito é custo que não aparece no caixa, mas sai do lucro.</p></div>
        </div>
      </div></section>

      <section id="menu"><div className="wrap">
        <div className="eyebrow">Como funciona o FOODPORN Menu</div>
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
              <li><span className="dot">✓</span><div><b>Fotos geradas por IA</b><span>Não tem foto profissional? A gente gera imagens dos seus pratos, no padrão FOODPORN.</span></div></li>
            </ul>
          </div>
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="eyebrow">Cliente piloto</div>
        <div className="case">
          <div>
            <h2>Jhonny's Garage, <em>em operação</em>.</h2>
            <p className="case-txt">Hamburgueria e petiscaria em São Domingos do Norte (ES). Os 110 itens do cardápio entraram no ar em um dia, com pedido pelo QR Code da mesa direto no WhatsApp da casa. Como cliente piloto, o Jhonny's usa o FOODPORN Menu no dia a dia e ajuda a definir as próximas melhorias.</p>
            <div className="who"><b>Cardápio real</b> · navegue à vontade. Pedidos enviados chegam de verdade na cozinha do Jhonny's.</div>
            <div style={{ marginTop: 20 }}><a className="btn big" href={DEMO} target="_blank" rel="noopener">Ver o cardápio do Jhonny's</a></div>
          </div>
          <div className="qr"><canvas ref={qr} /><small>Aponte a câmera e veja como o cliente vê</small></div>
        </div>
      </div></section>

      <section className="lp-price alt" id="preco"><div className="wrap">
        <div className="lp-center">
          <div className="eyebrow">FOODPORN Menu · preço único</div>
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

      <section className="lp-ebooks" id="ebooks"><div className="wrap">
        <div className="lp-center">
          <div className="eyebrow">Biblioteca FOODPORN</div>
          <h2>Sua comida é boa. Mas pela foto, <em>ninguém diria isso</em>.</h2>
          <p className="lead">E-books diretos ao ponto para quem vive de comida: foto com celular, cardápio que vende, delivery, Instagram, preço e marca. Compra segura pela Hotmart, acesso na hora.</p>
        </div>

        <a className="manual" href={hm(MANUAL)} target="_blank" rel="noopener">
          <img src={`/fp/${MANUAL.code}.webp`} alt={`Capa do ${MANUAL.titulo}`} loading="lazy" />
          <div>
            <span className="tag">O mais completo</span>
            <h3>{MANUAL.titulo}</h3>
            <p>{MANUAL.sub}. Foto, cardápio, marketing, atendimento e precificação reunidos em um único guia.</p>
            <div className="price"><s>{brl(MANUAL.de, 0)}</s><b>{brl(MANUAL.preco, 0)}</b></div>
            <span className="btn big glow">Quero o Manual Completo</span>
          </div>
        </a>

        <div className="chips" role="tablist" aria-label="Filtrar e-books por tema">
          {TEMAS.map(t => <button key={t} type="button" role="tab" aria-selected={tema === t} className={tema === t ? 'on' : ''} onClick={() => setTema(t)}>{t}</button>)}
        </div>
        <div className="books">
          {lista.map(e => (
            <a key={e.code} className="book" href={hm(e)} target="_blank" rel="noopener">
              <div className="cv"><img src={`/fp/${e.code}.webp`} alt={`Capa do e-book ${e.titulo}`} loading="lazy" width="600" height="600" /></div>
              <span className="tema">{e.tema}</span>
              <h3>{e.titulo}</h3>
              <p>{e.sub}</p>
              <div className="price"><s>R$ 67</s><b>R$ 37</b><span className="go">Comprar →</span></div>
            </a>
          ))}
        </div>
        <p className="fine lp-center">Pagamento e entrega pela Hotmart, com garantia de 7 dias.</p>
      </div></section>

      <section className="alt"><div className="wrap">
        <div className="eyebrow">Comparativo</div>
        <h2>Papel, aplicativo ou <em>FOODPORN Menu</em>?</h2>
        <div className="tbl-wrap"><table>
          <thead><tr><th></th><th>Papel + anotação</th><th>Marketplace</th><th className="me">FOODPORN Menu</th></tr></thead>
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

      <section><div className="wrap">
        <div className="eyebrow">Perguntas frequentes</div>
        <h2>O que todo dono <em>pergunta</em>.</h2>
        <div style={{ marginTop: 20 }}>
          <details><summary>Preciso de WhatsApp Business ou número novo?</summary><p>Não. Funciona com o WhatsApp que você já usa. O pedido chega como uma mensagem normal. Se quiser organizar com etiquetas, o WhatsApp Business gratuito ajuda, mas não é obrigatório.</p></details>
          <details><summary>Meu cliente precisa instalar alguma coisa?</summary><p>Não. O QR abre o cardápio no navegador do celular. O único aplicativo envolvido é o WhatsApp, que ele já tem.</p></details>
          <details><summary>Quem monta o cardápio?</summary><p>A gente. Você manda foto ou PDF do cardápio atual e em até um dia útil ele está no ar. Depois, você mesmo edita pelo painel quando quiser.</p></details>
          <details><summary>Funciona para delivery?</summary><p>Hoje o foco é pedido na mesa e retirada no balcão. Delivery com taxa por bairro está em desenvolvimento e entra sem custo extra para quem já assina.</p></details>
          <details><summary>Tem taxa por pedido ou por mesa?</summary><p>Nenhuma. O valor é fixo, independente de quantos pedidos, mesas ou itens você tiver.</p></details>
          <details><summary>E se eu quiser cancelar?</summary><p>No mensal, cancela a qualquer momento e o cardápio fica no ar até o fim do período pago. No anual, você paga 10 meses e usa 12.</p></details>
          <details><summary>Os e-books fazem parte da assinatura?</summary><p>Não. Os e-books são vendidos à parte pela Hotmart, com acesso imediato e garantia de 7 dias. Servem para qualquer negócio de comida, assinante ou não.</p></details>
          <details><summary>Quem está por trás da FOODPORN?</summary><p>Igor Caetano, profissional de marketing e negócios do Espírito Santo, especializado em comida. O suporte é feito por ele, no WhatsApp, sem robô e sem fila.</p></details>
        </div>
        <div className="maker">
          <img className="av" src="/fp/logo.webp" alt="" width="72" height="72" />
          <div>
            <div className="nm">Igor Caetano · criador da FOODPORN</div>
            <p>Criei a FOODPORN para ajudar negócios de comida a vender pelo que têm de melhor: o produto. Primeiro com foto e conteúdo, agora com o cardápio digital. Qualquer dúvida, me chama direto. Respondo pessoalmente.</p>
            <div style={{ marginTop: 10 }}><a className="btn ghost" href={zap('Olá Igor! Vi o site da FOODPORN e quero saber mais sobre o FOODPORN Menu.')} target="_blank" rel="noopener">Falar com o Igor no WhatsApp</a></div>
          </div>
        </div>
      </div></section>

      <section className="lp-final"><div className="bg" /><div className="wrap">
        <div className="eyebrow">Comece hoje</div>
        <h2>Seu cardápio no ar <em>amanhã</em>.</h2>
        <p className="lead" style={{ marginInline: 'auto' }}>Assine, mande o cardápio atual pelo WhatsApp e receba o QR Code pronto para imprimir.</p>
        <div className="ctas">
          <a className="btn big glow" href="#preco">Assinar o FOODPORN Menu</a>
          <a className="btn big ghost" href="#ebooks">Ver os e-books</a>
        </div>
      </div></section>

      <footer className="lp-foot"><div className="wrap">
        <span><b>FOODPORN</b> · foodporn.com.br</span>
        <span><a href="#ebooks">E-books</a> · <a href={zap('Olá Igor! Quero tirar uma dúvida sobre a FOODPORN.')} target="_blank" rel="noopener">WhatsApp</a> · <Link to="/login">Área do cliente</Link></span>
        <span>Espírito Santo, Brasil</span>
      </div></footer>

      <a className="lp-zap" href={zap('Olá Igor! Vi o site da FOODPORN e quero saber mais.')} target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><ZapIcon />WhatsApp</a>
    </div>
  )
}
