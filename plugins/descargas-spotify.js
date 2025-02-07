import axios from 'axios';
import fetch from 'node-fetch';

let handler = async (m, { conn, text, usedPrefix, command }) => {

    if (!text) throw `${lenguajeGB.smsMalused2()} ⊱ *${usedPrefix + command} Bellyache*`;

    try {
        m.react('⌛️');

        let songInfo = await spotifyxv(text);
        if (!songInfo.length) throw `❌ No se encontraron resultados, intente nuevamente.`;
        let song = songInfo[0];
        
        let data = await fetchFromPrimaryAPI(song.url);
        if (!data || !data.music) {
            data = await fetchFromSecondaryAPI(song.url);
        }

        if (!data || !data.music) throw "No se pudo obtener el enlace de descarga.";

        const info = `🪼 *Titulo:* ${data.title}\n\n🪩 *Artista:* ${data.artist}\n\n🦋 *Álbum:* ${song.album}\n\n⏳ *Duración:* ${song.duracion}\n\n🔗 *Enlace:* ${data.spotify}\n\n${wm}`;

        await conn.sendMessage(m.chat, { text: info, contextInfo: { forwardingScore: 9999999, isForwarded: true, 
        externalAdReply: {
            showAdAttribution: true,
            containsAutoReply: true,
            renderLargerThumbnail: true,
            title: 'Spotify Music',
            mediaType: 1,
            thumbnailUrl: data.thumbnail,
            mediaUrl: data.music,
            sourceUrl: data.music
        }}}, { quoted: m });

        await conn.sendMessage(m.chat, { audio: { url: data.music }, fileName: `${data.title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m });
        m.react('✅');

    } catch (e1) {
        m.react('❌');
        m.reply(`❌ No se encontraron resultados, intente nuevamente. Error: ${e1.message || e1}`);
        console.error(`Error: ${e1}`);
    }
};

handler.command = ['spotify', 'music'];
export default handler;

async function spotifyxv(query) {
    let token = await tokens();
    try {
        let response = await axios({
            method: 'get',
            url: 'https://api.spotify.com/v1/search?q=' + query + '&type=track',
            headers: {
                Authorization: 'Bearer ' + token,
            },
        });
        const tracks = response.data.tracks.items;
        const results = tracks.map((track) => ({
            name: track.name,
            artista: track.artists.map((artist) => artist.name),
            album: track.album.name,
            duracion: timestamp(track.duration_ms),
            url: track.external_urls.spotify,
            imagen: track.album.images.length ? track.album.images[0].url : '',
        }));
        return results;
    } catch (error) {
        console.error(`Error en spotifyxv: ${error}`);
        return [];
    }
}

async function tokens() {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + Buffer.from('acc6302297e040aeb6e4ac1fbdfd62c3:0e8439a1280a43aba9a5bc0a16f3f009').toString('base64'),
            },
            data: 'grant_type=client_credentials',
        });
        return response.data.access_token;
    } catch (error) {
        console.error(`Error en tokens: ${error}`);
        throw new Error('No se pudo obtener el token de acceso');
    }
}

async function fetchFromPrimaryAPI(url) {
    try {
        const res = await fetch(`https://apis-starlights-team.koyeb.app/starlight/spotifydl?url=${url}`);
        return await res.json();
    } catch (e) {
        console.error(`Error al usar la API primaria: ${e}`);
        return null;
    }
}

async function fetchFromSecondaryAPI(url) {
    try {
        const res = await fetch(`https://apis-starlights-team.koyeb.app/starlight/spotify-albums-list?url=${url}`);
        return await res.json();
    } catch (e) {
        console.error(`Error al usar la API secundaria: ${e}`);
        return null;
    }
}

function timestamp(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}