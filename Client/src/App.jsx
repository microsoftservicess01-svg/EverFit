
import React, { useState } from 'react';

function hexToBytes(hex) {
  if (!hex) return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function deriveKeyFromPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const baseKey = await window.crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  return key;
}
async function encryptJSON(key, jsonObj) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const data = enc.encode(JSON.stringify(jsonObj));
  const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { iv: bytesToHex(iv), ciphertext: bytesToHex(ct) };
}

// Size calculation and recommendation logic
function computeSize(band, bust){
  const cmToIn = x => x / 2.54;
  const bandIn = Math.round(cmToIn(band));
  const evenBand = bandIn % 2 === 0 ? bandIn : bandIn - 1;
  const bustIn = Math.round(cmToIn(bust));
  const cupDiff = bustIn - evenBand;
  const cupLetters = ['AA','A','B','C','D','DD','E','F'];
  const idx = Math.max(0, Math.min(cupLetters.length - 1, cupDiff));
  return `${evenBand}${cupLetters[idx]}`;
}
function recommendStyles(sizeStr, activity, bodyFeatures){
  const recommendations = [];
  if (activity === 'sports') {
    recommendations.push({ style: 'High Impact Sports Bra (Encapsulation + Compression)', reason: 'Max support, wide straps, high coverage' });
    recommendations.push({ style: 'Racerback Compression', reason: 'Minimises bounce for intense workouts' });
  } else if (activity === 'daily') {
    recommendations.push({ style: 'T-Shirt Bra (Moulded Cups)', reason: 'Smooth under clothes and light support' });
    recommendations.push({ style: 'Balconette', reason: 'Good lift and shape for certain outfits' });
  } else if (activity === 'sleep') {
    recommendations.push({ style: 'Soft Wireless Bra / Bralette', reason: 'Comfort-first, low compression' });
  }
  if (bodyFeatures.root === 'wide') {
    recommendations.push({ style: 'Full Coverage with wide side panels', reason: 'Better containment for wide roots' });
  }
  return recommendations;
}

export default function App(){
  const [band, setBand] = useState('');
  const [bust, setBust] = useState('');
  const [activity, setActivity] = useState('daily');
  const [root, setRoot] = useState('average');
  const [passphrase, setPassphrase] = useState('');
  const [status, setStatus] = useState('Ready');
  const [result, setResult] = useState(null);

  async function onCompute(){
    setStatus('Computing...');
    try {
      const size = computeSize(Number(band), Number(bust));
      const recs = recommendStyles(size, activity, { root });
      const payload = { timestamp: new Date().toISOString(), band, bust, size, activity, bodyFeatures: { root }, recommendations: recs };
      setResult({ size, recs });
      setStatus('Computed. (No data saved)');
      // prepare encrypted blob for optional download
      const salt = bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
      const key = await deriveKeyFromPassword(passphrase || 'demo-pass', salt);
      const enc = await encryptJSON(key, payload);
      // create downloadable blob
      const packaged = { salt, iv: enc.iv, ct: enc.ciphertext };
      const blob = new Blob([JSON.stringify(packaged)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      // create a temp link for user to download
      const a = document.createElement('a');
      a.href = url;
      a.download = `brafit-encrypted-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setStatus('Error: ' + e.message);
    }
  }

  return (
    <div className="container">
      <h1>BraFit — Full UI</h1>
      <p className="small">All computation & optional encryption happen in your browser. Nothing is uploaded or stored on the server.</p>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div>
          <label>Underbust (band) cm<br/><input value={band} onChange={e=>setBand(e.target.value)} type="number"/></label>
        </div>
        <div>
          <label>Full bust (bust) cm<br/><input value={bust} onChange={e=>setBust(e.target.value)} type="number"/></label>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
        <div>
          <label>Activity<br/>
            <select value={activity} onChange={e=>setActivity(e.target.value)}>
              <option value="daily">Daily / Casual</option>
              <option value="sports">Sports / High Impact</option>
              <option value="sleep">Sleep / Lounge</option>
            </select>
          </label>
        </div>
        <div>
          <label>Root width<br/>
            <select value={root} onChange={e=>setRoot(e.target.value)}>
              <option value="narrow">Narrow</option>
              <option value="average">Average</option>
              <option value="wide">Wide</option>
            </select>
          </label>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <label>Encryption passphrase (local, optional)<br/>
        <input type="password" value={passphrase} onChange={e=>setPassphrase(e.target.value)} placeholder="used to derive key on-device"/></label>
      </div>

      <div style={{marginTop:12, display:'flex', gap:8}}>
        <button onClick={onCompute} style={{background:'#0b63ce', color:'white'}}>Compute & Download Encrypted</button>
        <button onClick={()=>{ window.location.reload(); }}>Reset</button>
      </div>

      <div style={{marginTop:12}}>
        <div>Status: {status}</div>
        {result && <div style={{marginTop:8, padding:10, border:'1px solid #eee', borderRadius:6}}>
          <div><strong>Estimated Size:</strong> {result.size}</div>
          <div style={{marginTop:8}}><strong>Recommendations:</strong>
            <ul>
              {result.recs.map((r,i)=><li key={i}><strong>{r.style}</strong> — {r.reason}</li>)}
            </ul>
          </div>
        </div>}
      </div>

      <div style={{marginTop:18, fontSize:12, color:'#555'}}>
        This build performs all calculations client-side and triggers an encrypted download for testing.
      </div>
    </div>
  );
}
