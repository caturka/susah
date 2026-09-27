const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const pino = require('pino')
const express = require('express')
const app = express()
const PORT = process.env.PORT || 10000
let pairingCode = null
const BOT_NUMBER = process.env.PHONE_NUMBER || "628816863236"

app.get('/', (req,res) => {
  if(pairingCode) res.send(`<html style="background:#000;color:#0ff;text-align:center;padding:30px;font-family:monospace"><h1>BANGCATS BOT</h1><h2>${BOT_NUMBER}</h2><div style="font-size:55px;letter-spacing:8px;border:4px solid red;padding:20px;background:#111;color:#fff">${pairingCode}</div><p>WA > Linked Devices > Link with phone number</p></html>`)
  else res.send(`<h1>BANGCATS ONLINE ${BOT_NUMBER}</h1>`)
})
app.listen(PORT, () => console.log(PORT))

async function startBot(){
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()
    const sock = makeWASocket({ version, auth: state, logger: pino({level:'silent'}), browser: ['BANGCATS-BARBAR','Chrome','1.0'] })
    sock.ev.on('creds.update', saveCreds)
    if(!sock.authState.creds.registered){
        await new Promise(r=>setTimeout(r,3000))
        try{ pairingCode = await sock.requestPairingCode(BOT_NUMBER); console.log(pairingCode) }catch(e){}
    }
    sock.ev.on('connection.update', (up) => {
        if(up.connection==='close' && up.lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot()
        else if(up.connection==='open'){ pairingCode=null; console.log('CONNECTED') }
    })

    const KATA_KASAR_INDO = ["anjing","anjir","bangsat","bajingan","tolol","goblok","idiot","asu","kontol","memek","ngentot","jancok","bego","lonte","sundal","pukimak","babi","tai"]
    const KATA_KASAR_JAWA = ["jancok","cok","asu","kirik","jamput","matamu","ndasmu","raimu","cangkemu","telek","taek","mbokne ancok","diancok","contol","tempek"]

    const ROAST_PRIVATE = [
      "Jancok koen cok! Ngomong opo goblok?!menu ae anjing!",
      "Matamu asu! Bacot ae kontol!!menu cepet!",
      "Ndasmu tolol! Goblok tenan!!menu ae bangsat!",
      "Raimu bangsat! Kirik!!menu jancok!",
      "Cangkemu asu! Bajingan!!menu ae anjing!",
      "Telekk! Taek! Jamput!!menu cok!",
      "Mbokne ancok! Diancok!!menu ae!",
      "Kontol! Memek! Anjing!!menu ae goblok!",
      "Koen kirik tenan asuw!!menu ae jancok!",
      "Pukimak! Bego!!menu cepet tolol!"
    ]
    const KALEM_GRUP = ["Halo kak! Ketik!menu ya","Siap kak!!menu aja!"]

    function isGroup(jid){ return jid.endsWith('@g.us') }

    sock.ev.on('messages.upsert', async ({messages}) => {
        let m = messages[0]; if(!m.message || m.key.fromMe) return
        let from = m.key.remoteJid
        let type = Object.keys(m.message)[0]
        let body = (type==='conversation')?m.message.conversation:(type==='extendedTextMessage')?m.message.extendedTextMessage.text:(type==='imageMessage')?m.message.imageMessage.caption:(type==='videoMessage')?m.message.videoMessage.caption:''
        if(!body) return
        let cmd = body.trim().split(' ')[0].toLowerCase()
        let q = body.trim().split(' ').slice(1).join(' ').trim()

        if(cmd === "!menu"){
            let txt = `*🐱 BANGCATS BOT - ${BOT_NUMBER}*\nPRIVATE BAR-BAR | GRUP KALEM\n\nDOWNLOADER:\n!tt <link> TikTok\n!ig <link> IG\n!fb <link> FB\n!yt <link> YT\n!play <judul> MP3\n\nSTICKER:\n!s reply foto\n!toimg reply stiker\n\nKata di script:\n${KATA_KASAR_INDO.join(', ')}\n${KATA_KASAR_JAWA.join(', ')}`
            try{ if(fs.existsSync('./logo.jpg')) await sock.sendMessage(from, {image: fs.readFileSync('./logo.jpg'), caption: txt}); else await sock.sendMessage(from, {text: txt}) }catch{ await sock.sendMessage(from, {text: txt}) }
            return
        }
        if(cmd === "!tt"){ if(!q) return sock.sendMessage(from, {text:"Link mana jancok?"}); await sock.sendMessage(from, {text:"Downloading..."}); try{ let api = await fetch(`https://tikwm.com/api/?url=${q}`).then(r=>r.json()); if(api.data?.play) await sock.sendMessage(from, {video: {url: api.data.play}, caption:"Done jancok!"}) }catch{} return }
        if(cmd === "!ig"){ if(!q) return; await sock.sendMessage(from, {text:"Downloading IG..."}); try{ let api = await fetch(`https://api-aswin-sparky.koyeb.app/api/downloader/ig?url=${q}`).then(r=>r.json()); let url = api.data?.[0]?.url; if(url) await sock.sendMessage(from, {video: {url}, caption:"Done"}) }catch{} return }
        if(cmd === "!fb"){ if(!q) return; try{ let api = await fetch(`https://api-aswin-sparky.koyeb.app/api/downloader/fb?url=${q}`).then(r=>r.json()); let url = api.data?.hd; if(url) await sock.sendMessage(from, {video: {url}, caption:"Done"}) }catch{} return }
        if(cmd === "!yt"){ if(!q) return; try{ let api = await fetch(`https://api-aswin-sparky.koyeb.app/api/downloader/ytmp4?url=${q}`).then(r=>r.json()); if(api.data?.url) await sock.sendMessage(from, {video: {url: api.data.url}, caption: api.data.title}) }catch{} return }
        if(cmd === "!play"){ if(!q) return; try{ let s = await fetch(`https://api-aswin-sparky.koyeb.app/api/search/youtube?search=${encodeURIComponent(q)}`).then(r=>r.json()); let v = s.data?.[0]; let dl = await fetch(`https://api-aswin-sparky.koyeb.app/api/downloader/ytmp3?url=${v.url}`).then(r=>r.json()); if(dl.data?.url) await sock.sendMessage(from, {audio: {url: dl.data.url}, mimetype: 'audio/mpeg'}) }catch{} return }
        if(cmd === "!s"){ try{ let quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage; let target = quoted?{message: quoted}:m; let buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: pino({level:'silent'}), reuploadRequest: sock.updateMediaMessage }); await sock.sendMessage(from, {sticker: buffer}) }catch{} return }
        if(cmd === "!toimg"){ let quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage; if(quoted?.stickerMessage){ try{ let buffer = await downloadMediaMessage({message: quoted}, 'buffer', {}, { logger: pino({level:'silent'}), reuploadRequest: sock.updateMediaMessage }); await sock.sendMessage(from, {image: buffer}) }catch{} } return }
        if(cmd === "!ping"){ await sock.sendMessage(from, {text: isGroup(from)?"PONG Online":"PONG JANCOK Online asu!" }); return }

        if(!cmd.startsWith("!")){
            if(isGroup(from)){
                await sock.sendMessage(from, {text: KALEM_GRUP[Math.floor(Math.random()*KALEM_GRUP.length)]})
            } else {
                let roast = ROAST_PRIVATE[Math.floor(Math.random()*ROAST_PRIVATE.length)]
                await sock.sendMessage(from, {text: roast})
            }
            return
        }
    })
}
startBot()
