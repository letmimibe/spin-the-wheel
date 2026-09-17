const DEFAULTS = ['Coffee','Brunch','Movie','Walk','Nap','Cook','Dessert','Surprise'];
const palette = ['#c65132','#d8b56d','#b7c9b2','#aab9c8','#d9a8a0','#9c775f','#cbbfa6','#7f8f78'];

const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const entriesEl = document.getElementById('entries');
const addForm = document.getElementById('addForm');
const newEntry = document.getElementById('newEntry');
const result = document.getElementById('result');
const resultText = document.getElementById('resultText');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');
const clearBtn = document.getElementById('clearBtn');
const themeBtn = document.getElementById('themeBtn');
const confetti = document.getElementById('confetti');

let entries = loadEntries();
let rotation = 0;
let spinning = false;

function loadEntries(){
  try {
    const saved = JSON.parse(localStorage.getItem('spin.entries'));
    return Array.isArray(saved) ? saved.filter(Boolean).slice(0, 30) : [...DEFAULTS];
  } catch { return [...DEFAULTS]; }
}

function saveEntries(){ localStorage.setItem('spin.entries', JSON.stringify(entries)); }

function getCss(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function drawWheel(){
  const dpr = window.devicePixelRatio || 1;
  const cssSize = wheel.getBoundingClientRect().width || 760;
  const size = Math.round(cssSize * dpr);
  wheel.width = size;
  wheel.height = size;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const center = cssSize/2;
  const radius = center - 12;
  ctx.clearRect(0,0,cssSize,cssSize);

  if (!entries.length){
    ctx.beginPath();
    ctx.arc(center,center,radius,0,Math.PI*2);
    ctx.fillStyle = getCss('--soft');
    ctx.fill();
    ctx.strokeStyle = getCss('--line');
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = getCss('--muted');
    ctx.font = "700 18px 'Hanken Grotesk'";
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Add an option to begin', center, center);
    return;
  }

  const slice = Math.PI*2/entries.length;
  entries.forEach((label,i)=>{
    const start = rotation + i*slice;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(center,center);
    ctx.arc(center,center,radius,start,end);
    ctx.closePath();
    ctx.fillStyle = palette[i % palette.length];
    ctx.fill();
    ctx.strokeStyle = getCss('--panel');
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(center,center);
    ctx.rotate(start + slice/2);
    ctx.textAlign='right';
    ctx.textBaseline='middle';
    ctx.fillStyle = '#fffaf3';
    ctx.font = `800 ${Math.max(11,Math.min(19, 190/Math.max(entries.length,6)))}px 'Hanken Grotesk'`;
    const max = radius * .67;
    let text = label.trim() || 'Untitled';
    while(ctx.measureText(text).width > max && text.length > 4) text = text.slice(0,-2) + '…';
    ctx.fillText(text, radius - 25, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center,center,radius,0,Math.PI*2);
  ctx.strokeStyle = getCss('--brown');
  ctx.lineWidth = 3;
  ctx.stroke();
}

function renderEntries(){
  entriesEl.innerHTML='';
  if (!entries.length){
    entriesEl.innerHTML='<div class="empty-state">Your wheel is empty. Add a few options below ✦</div>';
  } else {
    entries.forEach((value,index)=>{
      const row=document.createElement('div');
      row.className='entry';
      row.innerHTML=`<span class="entry-dot" style="--entry-color:${palette[index%palette.length]}"></span><input aria-label="Option ${index+1}" maxlength="38"><button class="remove-btn" type="button" aria-label="Remove option">×</button>`;
      const input=row.querySelector('input');
      input.value=value;
      input.addEventListener('input',()=>{
        entries[index]=input.value;
        saveEntries(); drawWheel();
      });
      row.querySelector('button').addEventListener('click',()=>{
        if(spinning) return;
        entries.splice(index,1); saveEntries(); renderEntries(); drawWheel(); updateSpinState();
      });
      entriesEl.appendChild(row);
    });
  }
  updateSpinState();
}

function updateSpinState(){ spinBtn.disabled = spinning || entries.length < 2; }

function normalizeAngle(a){ const two=Math.PI*2; return ((a%two)+two)%two; }

function spin(){
  if(spinning || entries.length<2) return;
  spinning=true; updateSpinState();
  result.classList.remove('winner');
  resultText.textContent='Spinning…';

  const startRotation=rotation;
  const extraTurns = 6 + Math.random()*4;
  const target = startRotation + extraTurns*Math.PI*2 + Math.random()*Math.PI*2;
  const duration = 4200;
  const started = performance.now();

  const ease = t => 1 - Math.pow(1-t,4);
  function frame(now){
    const t=Math.min(1,(now-started)/duration);
    rotation=startRotation+(target-startRotation)*ease(t);
    drawWheel();
    if(t<1){ requestAnimationFrame(frame); return; }

    const slice=Math.PI*2/entries.length;
    const pointerAngle=0;
    const relative=normalizeAngle(pointerAngle-rotation);
    const winnerIndex=Math.floor(relative/slice)%entries.length;
    const winner=entries[winnerIndex];
    resultText.textContent=winner;
    result.classList.add('winner');
    burstConfetti();
    spinning=false; updateSpinState();
  }
  requestAnimationFrame(frame);
}

function burstConfetti(){
  confetti.innerHTML='';
  const colors=[...palette,getCss('--brown')];
  for(let i=0;i<38;i++){
    const p=document.createElement('span');
    p.className='confetti-piece';
    p.style.left=`${10+Math.random()*80}%`;
    p.style.top=`${-20-Math.random()*100}px`;
    p.style.background=colors[i%colors.length];
    p.style.transform=`rotate(${Math.random()*180}deg)`;
    p.style.animationDelay=`${Math.random()*150}ms`;
    confetti.appendChild(p);
  }
  setTimeout(()=>confetti.innerHTML='',1500);
}

addForm.addEventListener('submit',e=>{
  e.preventDefault();
  const value=newEntry.value.trim();
  if(!value || entries.length>=30) return;
  entries.push(value); newEntry.value=''; saveEntries(); renderEntries(); drawWheel();
});
spinBtn.addEventListener('click',spin);
shuffleBtn.addEventListener('click',()=>{
  if(spinning) return;
  for(let i=entries.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]];}
  saveEntries(); renderEntries(); drawWheel();
});
resetBtn.addEventListener('click',()=>{
  if(spinning) return;
  entries=[...DEFAULTS]; rotation=0; saveEntries(); renderEntries(); drawWheel(); resultText.textContent='Pick your fate ✦';
});
clearBtn.addEventListener('click',()=>{
  if(spinning) return;
  entries=[]; rotation=0; saveEntries(); renderEntries(); drawWheel(); resultText.textContent='Add options to begin';
});

function loadTheme(){
  const saved=localStorage.getItem('spin.theme');
  const dark=saved==='dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=dark?'dark':'light';
  themeBtn.textContent=dark?'☾':'☼';
}
themeBtn.addEventListener('click',()=>{
  const dark=document.documentElement.dataset.theme!=='dark';
  document.documentElement.dataset.theme=dark?'dark':'light';
  localStorage.setItem('spin.theme',dark?'dark':'light');
  themeBtn.textContent=dark?'☾':'☼';
  drawWheel();
});

let resizeTimer;
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawWheel,80)});
loadTheme(); renderEntries(); drawWheel();
