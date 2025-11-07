import { NextResponse } from 'next/server'

function b64(s){ return Buffer.from(s, 'utf-8').toString('base64') }

export async function POST(req){
  try{
    const { symbol } = await req.json()
    const sym = String(symbol||'').toUpperCase().trim()
    if(!sym) return NextResponse.json({ ok:false, error:'symbol missing' }, { status:400 })
    const repo = process.env.GH_REPO
    const token = process.env.GH_CONTENT_TOKEN
    if(!repo || !token) return NextResponse.json({ ok:false, error:'server missing GH_REPO or GH_CONTENT_TOKEN' }, { status:500 })

    const path = 'precomputed/_watchlist.txt'
    const base = `https://api.github.com/repos/${repo}/contents/${path}`
    let sha = undefined, text = ''
    {
      const r = await fetch(base, { headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' } })
      if(r.ok){
        const j = await r.json()
        sha = j.sha
        text = Buffer.from(j.content, 'base64').toString('utf-8')
      }
    }
    const set = new Set(text.split(/\r?\n/).map(s=>s.trim().toUpperCase()).filter(Boolean))
    set.add(sym)
    const content = Array.from(set).sort().join('\n') + '\n'

    const put = await fetch(base, {
      method:'PUT',
      headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' },
      body: JSON.stringify({ message:`chore: add ${sym} to ivr watchlist`, content:b64(content), sha })
    })
    if(!put.ok){
      const t = await put.text()
      return NextResponse.json({ ok:false, error:t }, { status:500 })
    }
    return NextResponse.json({ ok:true })
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 })
  }
}