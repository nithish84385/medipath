import lt from 'localtunnel';
import { exec } from 'child_process';

const PORT = 3001;

(async () => {
  try {
    const tunnel = await lt({ port: PORT });
    console.log(`\n✅ TUNNEL LIVE! Your public URL is:\n\n👉 ${tunnel.url}/api/whatsapp\n`);
    console.log(`Paste the above link into Twilio's "When a message comes in" field.\n`);
    
    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
    });

    tunnel.on('close', () => {
      console.log('Tunnel closed. Restart this script to get a new URL.');
      process.exit(1);
    });

    // Keep alive ping
    setInterval(async () => {
      try {
        await fetch(`${tunnel.url}/health`, { headers: { 'bypass-tunnel-reminder': 'true' } });
      } catch(e) {}
    }, 20000);
    
  } catch(err) {
    console.error('Failed to start tunnel:', err.message);
  }
})();
