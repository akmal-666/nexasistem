// src/lib/print.ts
export interface StrukItem {
  name: string
  qty: number
  unit: string
  price: number
  subtotal: number
}

export interface StrukData {
  business_name: string
  order_number: string
  date: string
  items: StrukItem[]
  subtotal: number
  discount?: number
  total: number
  paid_amount: number
  change: number
  payment_method: string
  cashier?: string
  footer?: string
}

export function printStruk(data: StrukData) {
  const width = 300
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Struk ${data.order_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: ${width}px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .header { margin-bottom: 8px; }
  .items { margin: 4px 0; }
  .item-name { padding-left: 4px; }
  .total-row { display: flex; justify-content: space-between; font-weight: bold; }
  @media print {
    body { width: 100%; }
    @page { size: 80mm auto; margin: 4mm; }
  }
</style>
</head>
<body>
<div class="header center">
  <div class="bold" style="font-size:14px">${data.business_name}</div>
  <div>${data.date}</div>
  <div>No: ${data.order_number}</div>
</div>
<div class="divider"></div>
<div class="items">
${data.items.map(item => `
  <div>${item.name} (${item.qty}${item.unit})</div>
  <div class="row">
    <span class="item-name">${item.qty} x ${formatRp(item.price)}</span>
    <span>${formatRp(item.subtotal)}</span>
  </div>
`).join('')}
</div>
<div class="divider"></div>
<div class="row"><span>Subtotal</span><span>${formatRp(data.subtotal)}</span></div>
${data.discount ? `<div class="row"><span>Diskon</span><span>-${formatRp(data.discount)}</span></div>` : ''}
<div class="divider"></div>
<div class="total-row"><span>TOTAL</span><span>${formatRp(data.total)}</span></div>
<div class="row"><span>Bayar (${data.payment_method})</span><span>${formatRp(data.paid_amount)}</span></div>
<div class="row bold"><span>Kembalian</span><span>${formatRp(data.change)}</span></div>
<div class="divider"></div>
${data.cashier ? `<div class="center">Kasir: ${data.cashier}</div>` : ''}
<div class="center" style="margin-top:8px">${data.footer || 'Terima kasih!'}</div>
<br><br>
</body>
</html>`

  const w = window.open('', '_blank', `width=${width + 50},height=600`)
  if (!w) return alert('Popup diblokir. Izinkan popup di browser.')
  w.document.write(html)
  w.document.close()
  w.print()
}

function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)
}