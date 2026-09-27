const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const app = express()
let pairingCode = "LOADING... Tunggu 10 detik"
let statusBot = "STARTING"

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()
    
    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["BANGCATS", "Chrome", "1.0"]
    })

    if (!sock.authState.creds.registered) {
        try {
            let phone = process.env.PHONE_NUMBER || "628816863236"
            phone = phone.replace(/[^0-9]/g, '')
            await new Promise(r => setTimeout(r, 5000))
            const code = await sock.requestPairingCode(phone)
            pairingCode = code
            statusBot = `CODE UNTUK ${phone}`
            console.log(`PAIRING CODE ${phone}: ${code}`)
        } catch (e) {
            console.log("GAGAL MINTA CODE:", e.message)
            pairingCode = "GAGAL: " + e.message
        }
    } else {
        pairingCode = "SUDAH CONNECTED!"
        statusBot = "CONNECTED"
    }

    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', (u) => {
        const { connection } = u
        if (connection === 'open') {
            pairingCode = "SUDAH CONNECTED BOS!"
            statusBot = "CONNECTED 24/7"
            console.log("CONNECTED!")
        }
        if (connection === 'close') startBot()
    })

    // FITUR BALAS CHAT
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || "").toLowerCase()
        const from = m.key.remoteJid
        
        if (text.includes("halo") || text.includes("menu") || text === "!menu") {
            await sock.sendMessage(from, { 
                text: `BANGCATS BAR-BAR 24/7 JANCUK 🔥\n\nFITUR:\n!ig link - download IG\n!tt link - download Tiktok\n!fb link - download FB\n!yt link - download YT\n!play judul - download lagu\n!stiker - jadi stiker\n\nBOT BY ${process.env.PHONE_NUMBER}`,
                contextInfo: { externalAdReply: { title: "BANGCATS BOT", body: "24/7 ON", thumbnailUrl: "", sourceUrl: "" } }
            })
        }
    })
}

app.get('/', (req, res) => {
    res.send(`
    <html style="background:black;color:lime;font-family:monospace;text-align:center;padding-top:50px">
    <h1>BANGCATS BOT 24/7</h1>
    <h2>${statusBot}</h2>
    <h1 style="font-size:60px;letter-spacing:10px;color:yellow;border:3px solid lime;padding:20px">${pairingCode}</h1>
    <p>WA > Linked Devices > Link with phone number > Masukkan kode di atas</p>
    <p>Refresh halaman ini tiap 10 detik</p>
    <script>setTimeout(()=>location.reload(),10000)</script>
    </html>
    `)
})

app.listen(process.env.PORT || 10000, () => console.log("WEB ON"))
startBot()
