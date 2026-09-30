import { chromium } from 'playwright';
const b=await chromium.connectOverCDP('http://127.0.0.1:9444'); const p=b.contexts()[0].pages().find(x=>x.url().includes('suno.com'))!;
console.log('URL',p.url()); console.log((await p.locator('body').innerText()).slice(-4000));
console.log('buttons',await p.locator('button').evaluateAll(bs=>bs.map(b=>({t:(b as HTMLElement).innerText,a:b.getAttribute('aria-label'),d:(b as HTMLButtonElement).disabled})).filter(x=>x.t||x.a)));
