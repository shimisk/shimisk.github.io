process.on('unhandledRejection', (e) => { console.error('unhandled', e); process.exit(1) })

const candidates = [
  ['ap','https://apnews.com/apf-topnews?output=rss'],
  ['ap','https://apnews.com/hub/ap-top-news?output=rss'],
  ['ap','https://apnews.com/rss'],
  ['reuters','https://www.reuters.com/world/rss'],
  ['reuters','https://www.reutersagency.com/feed/?best-topics=news&post_type=best'],
  ['axios','https://www.axios.com/feed.xml'],
  ['axios','https://www.axios.com/feed/'],
  ['thehill','https://thehill.com/news/feed/'],
  ['thehill','https://thehill.com/homenews/feed/'],
  ['economist','https://www.economist.com/international/rss.xml'],
  ['economist','https://www.economist.com/the-world-this-week/rss.xml'],
  ['nypost','https://nypost.com/news/feed/'],
  ['nypost','https://nypost.com/us-news/feed/']
]

async function ok(url){
  const u = encodeURIComponent(url)
  const attempts = [
    ['allorigins-get',`https://api.allorigins.win/get?url=${u}`, async r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); const j=await r.json(); if(!j?.contents) throw new Error('empty') }],
    ['allorigins-raw',`https://api.allorigins.win/raw?url=${u}`, async r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); const t=await r.text(); if(!t.trim()) throw new Error('empty') }],
    ['rss2json',`https://api.rss2json.com/v1/api.json?rss_url=${u}`, async r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); const j=await r.json(); if(j?.status!=='ok') throw new Error(j?.message||'bad'); if(!Array.isArray(j?.items)||j.items.length===0) throw new Error('no items') }]
  ]
  for (const [name, endpoint, check] of attempts){
    try { const r=await fetch(endpoint); await check(r); return name } catch {}
  }
  return null
}

for (const [id,url] of candidates){
  const via = await ok(url)
  console.log(`${via ? 'OK' : 'FAIL'}\t${via || 'none'}\t${id}\t${url}`)
}
