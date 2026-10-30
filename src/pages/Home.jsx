import { Link } from 'react-router-dom'

// Landing provisória. A versão de vendas entra no Dia 3.
export default function Home() {
  return (
    <div className="center"><div className="box">
      <h1>Mesa<em>fy</em></h1><p style={{margin:0,fontFamily:"var(--cond)",textTransform:"uppercase",letterSpacing:".1em",fontSize:13}}>Cardápio digital com pedido no WhatsApp</p>
      <p className="muted" style={{ margin: 0 }}>QR Code na mesa, cardápio com a cara do seu negócio, pedidos chegando na cozinha em tempo real. Sem comissão.</p>
      <Link className="btn" to="/jhonnys-garage" style={{ padding: 14 }}>Ver demonstração: Jhonny's Garage</Link>
      <Link className="btn ghost" to="/login">Entrar no painel</Link>
    </div></div>
  )
}
