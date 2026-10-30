import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useAuth } from '../../lib/auth'
import { DOMINIO } from '../../lib/supabase'

export default function QR() {
  const { rest } = useAuth()
  const url = `${window.location.protocol}//${DOMINIO}/${rest.slug}`
  const cv = useRef(); const [png, setPng] = useState('')
  useEffect(() => {
    QRCode.toCanvas(cv.current, url, { width: 320, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#141111', light: '#ffffff' } })
    QRCode.toDataURL(url, { width: 1600, margin: 3, errorCorrectionLevel: 'H' }).then(setPng)
  }, [url])
  return (
    <div className="page">
      <h1>QR Code</h1>
      <p className="sub">Imprima e coloque nas mesas, no balcão e na porta. Aponta para <b>{url}</b></p>
      <div className="grid g2">
        <div className="card" style={{ display: 'grid', placeItems: 'center', gap: 12, background: '#fff' }}>
          <canvas ref={cv} style={{ maxWidth: '100%' }} />
        </div>
        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <a className="btn" href={png} download={`qr-${rest.slug}.png`} style={{ padding: 14 }}>Baixar PNG em alta (1600px)</a>
          <p className="hint">Tamanho mínimo recomendado na mesa: 4 x 4 cm. Em adesivo ou display acrílico, 6 x 6 cm.</p>
          <p className="hint">Dica: escreva "Peça pelo QR Code" acima do código. Mesas com essa frase recebem mais pedidos digitais.</p>
        </div>
      </div>
    </div>
  )
}
