// Links antigos com #âncora (site de página única) levam para as páginas novas
(function(){const M={"laser":"/gravacao-a-laser/","impressao-3d":"/impressao-3d/","sobre":"/sobre/","orcamento":"/orcamento/","inicio":"/","linha-fitness":"/impressao-3d/#linha-fitness","laser-trabalhos":"/gravacao-a-laser/#laser-trabalhos","laser-avaliacoes":"/gravacao-a-laser/#laser-avaliacoes"};
  const h=location.hash.slice(1);if(location.pathname==="/"&&M[h])location.replace(M[h]);})();

const nav=document.getElementById("main-nav"),tog=document.getElementById("menu-toggle");
const dd=document.getElementById("dd-servicos"),ddBtn=dd.querySelector(".dd-btn");
function setDD(open){dd.classList.toggle("open",open);ddBtn.setAttribute("aria-expanded",open)}
function setMenu(open){nav.classList.toggle("open",open);tog.setAttribute("aria-expanded",open);tog.setAttribute("aria-label",open?"Fechar menu":"Abrir menu")}
ddBtn.addEventListener("click",e=>{e.stopPropagation();setDD(!dd.classList.contains("open"))});
tog.addEventListener("click",()=>setMenu(!nav.classList.contains("open")));
document.addEventListener("click",e=>{if(!dd.contains(e.target))setDD(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){setDD(false);setMenu(false);ddBtn.focus()}});
if(matchMedia("(hover:hover) and (min-width:821px)").matches){dd.addEventListener("mouseenter",()=>setDD(true));dd.addEventListener("mouseleave",()=>setDD(false))}
// Orçamento: monta a mensagem e entrega pronta para o WhatsApp
(function(){
  const PROD={"Gravação a Laser":["Copo térmico com tampa (473 ml)","Copo com alça e canudo","Copo inox","Garrafa térmica","Kit presente","Brinde corporativo (lote)","Outro"],
              "Impressão 3D":["Chaveiro Linha Fitness","Chaveiro com nome","Peça decorativa","Organizador / porta-canetas","Peça sob medida","Outro"]};
  const f=document.getElementById("quote");if(!f)return;
  const sel=document.getElementById("q-produto");
  const fill=()=>{const s=f.servico.value;sel.innerHTML=PROD[s].map(p=>`<option>${p}</option>`).join("")};
  f.querySelectorAll('input[name="servico"]').forEach(r=>r.addEventListener("change",fill));fill();
  const ready=document.getElementById("quote-ready"),tips=document.getElementById("quote-tips"),pre=document.getElementById("quote-text"),send=document.getElementById("quote-send");
  f.addEventListener("submit",e=>{
    e.preventDefault();
    let ok=true;
    [["q-arte","arte"],["q-nome","nome"]].forEach(([id])=>{const el=document.getElementById(id),wrap=el.closest(".fld");const bad=!el.value.trim();wrap.classList.toggle("bad",bad);if(bad&&ok){el.focus();ok=false}});
    if(!ok)return;
    const d=f.data.value?f.data.value.split("-").reverse().join("/"):"sem data definida";
    const msg=`Olá, PersonalizaArte! Quero um orçamento.\n\n• Serviço: ${f.servico.value}\n• Produto: ${sel.value}\n• Quantidade: ${f.qtd.value||1}\n• Personalização: ${f.arte.value.trim()}\n• Para quando: ${d}\n• Entrega: ${f.entrega.value}\n\nMeu nome é ${f.nome.value.trim()}.`;
    pre.textContent=msg;send.href="https://wa.me/5519981862800?text="+encodeURIComponent(msg);
    ready.hidden=false;tips.hidden=true;
    if(matchMedia("(max-width:860px)").matches)ready.scrollIntoView({behavior:"smooth",block:"start"});
  });
  document.getElementById("quote-copy").addEventListener("click",ev=>{const b=ev.currentTarget;
    navigator.clipboard.writeText(pre.textContent).then(()=>{b.textContent="Mensagem copiada";setTimeout(()=>b.textContent="Copiar mensagem",1800)}).catch(()=>{const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r)})});
})();
// Carrossel: setas, bolinhas, teclado, arrastar com o mouse e deslizar no celular
(function(){
  const track=document.getElementById("car-track");if(!track)return;
  const slides=[...track.children],dots=document.getElementById("car-dots"),count=document.getElementById("car-count");
  const prev=document.getElementById("car-prev"),next=document.getElementById("car-next");
  slides.forEach((s,i)=>{const b=document.createElement("button");b.type="button";b.setAttribute("aria-label","Ir para a foto "+(i+1));b.onclick=()=>go(i);dots.appendChild(b)});
  const cur=()=>{let best=0,d=Infinity;slides.forEach((s,i)=>{const x=Math.abs(s.offsetLeft-track.offsetLeft-track.scrollLeft);if(x<d){d=x;best=i}});return best};
  const go=i=>{i=Math.max(0,Math.min(slides.length-1,i));track.scrollTo({left:slides[i].offsetLeft-track.offsetLeft})};
  function update(){const i=cur(),end=track.scrollLeft+track.clientWidth>=track.scrollWidth-4;
    [...dots.children].forEach((b,k)=>b.setAttribute("aria-current",k===i));count.textContent=(i+1)+" / "+slides.length;
    prev.disabled=track.scrollLeft<4;next.disabled=end}
  prev.onclick=()=>go(cur()-1);next.onclick=()=>go(cur()+1);
  track.addEventListener("scroll",()=>requestAnimationFrame(update),{passive:true});
  track.addEventListener("keydown",e=>{if(e.key==="ArrowRight"){e.preventDefault();go(cur()+1)}if(e.key==="ArrowLeft"){e.preventDefault();go(cur()-1)}});
  let down=false,sx=0,sl=0,moved=false;
  track.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse")return;down=true;moved=false;sx=e.clientX;sl=track.scrollLeft;track.classList.add("drag")});
  addEventListener("pointermove",e=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>3)moved=true;track.scrollLeft=sl-dx});
  addEventListener("pointerup",()=>{if(!down)return;down=false;track.classList.remove("drag");go(cur())});
  addEventListener("resize",update);update();
})();
// links internos de rolagem (não trocam de página)
document.querySelectorAll("[data-scroll]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const t=document.querySelector(a.getAttribute("href"));if(t)t.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}));
document.querySelectorAll(".copy").forEach(b=>b.addEventListener("click",()=>{
  navigator.clipboard.writeText(b.dataset.copy).then(()=>{b.textContent="Copiado";setTimeout(()=>b.textContent="Copiar",1600)}).catch(()=>{const r=document.createRange();r.selectNodeContents(b.parentNode);const s=getSelection();s.removeAllRanges();s.addRange(r)});
}));

// Menu: marca a página atual
(function(){const p=location.pathname,svc=["/gravacao-a-laser/","/copos-personalizados/","/brindes-corporativos/","/impressao-3d/"];
  document.querySelectorAll("#main-nav a[href], #main-nav .dd-btn").forEach(a=>{const h=a.getAttribute("href");if((h&&h===p)||(a.classList.contains("dd-btn")&&svc.includes(p)))a.setAttribute("aria-current","page")});})();
