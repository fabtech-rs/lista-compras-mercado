const K_ATUAL='mercado_lista_atual_v2',K_HIST='mercado_historico_v2';
let atual=ler(K_ATUAL,null),historico=ler(K_HIST,[]),rascunho=[];
const $=id=>document.getElementById(id);
const el={criacao:$('telaCriacao'),compra:$('telaCompra'),hist:$('telaHistorico'),nomeLista:$('nomeLista'),mercado:$('nomeMercado'),listaPlan:$('listaPlanejamento'),vazioPlan:$('vazioPlanejamento'),compraNome:$('compraNome'),compraMercado:$('compraMercado'),listaCompra:$('listaCompra'),listaExtras:$('listaExtras'),blocoExtras:$('blocoExtras'),total:$('totalCarrinho'),totalRodape:$('totalRodape'),progresso:$('progressoItens'),extras:$('totalExtras'),barra:$('barraProgresso'),modalPlan:$('modalPlanejado'),modalPegar:$('modalPegar'),modalExtra:$('modalExtra'),modalFim:$('modalFinalizar'),modalDetalhe:$('modalDetalhe'),toast:$('toast')};

$('btnAdicionarPlanejado').onclick=()=>abrirPlanejado();
$('btnCriarLista').onclick=criarLista;
$('btnAdicionarExtra').onclick=()=>abrir(el.modalExtra);
$('btnFinalizar').onclick=abrirFinal;
$('btnExcluirLista').onclick=excluirLista;
$('btnNovaLista').onclick=novaLista;
$('navAtual').onclick=mostrarAtual;
$('navHistorico').onclick=mostrarHistorico;
$('navInformacoes').onclick=mostrarInformacoes;
$('btnVoltarAtual').onclick=mostrarAtual;
$('fimDocumento').oninput=divergencia;
$('btnSalvarCompra').onclick=salvarCompra;
$('planejadoNome').addEventListener('input',renderSugestoesProdutos);
$('planejadoNome').addEventListener('focus',renderSugestoesProdutos);

document.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=()=>fechar(b.closest('.modal')));

$('formPlanejado').onsubmit=e=>{
 e.preventDefault();
 const id=$('planejadoId').value,nome=$('planejadoNome').value.trim(),q=Number($('planejadoQtd').value),un=$('planejadoUn').value;
 if(!nome||q<=0)return toast('Preencha os dados do produto.');
 const obj={id:id||uid(),nome,quantidade:q,unidade:un};
 if(id){const i=rascunho.findIndex(x=>x.id===id);rascunho[i]=obj}else rascunho.push(obj);
 fechar(el.modalPlan);renderRascunho();
};

$('formPegar').onsubmit=e=>{
 e.preventDefault();
 const id=$('pegarId').value,item=atual.planejados.find(x=>x.id===id);
 const q=Number($('pegarQtd').value),v=Number($('pegarValor').value);
 if(!item||q<=0||v<0)return;
 const existente=atual.comprados.find(x=>x.planejadoId===id);
 const obj={id:existente?.id||uid(),planejadoId:id,nome:item.nome,quantidade:q,unidade:item.unidade,valorUnitario:v,extra:false};
 if(existente)Object.assign(existente,obj);else atual.comprados.push(obj);
 salvar();fechar(el.modalPegar);renderCompra();
};

$('formExtra').onsubmit=e=>{
 e.preventDefault();
 const nome=$('extraNome').value.trim(),q=Number($('extraQtd').value),v=Number($('extraValor').value),un=$('extraUn').value;
 if(!nome||q<=0||v<0)return;
 atual.comprados.push({id:uid(),planejadoId:null,nome,quantidade:q,unidade:un,valorUnitario:v,extra:true});
 salvar();e.target.reset();$('extraQtd').value=1;fechar(el.modalExtra);renderCompra();
};

function abrirPlanejado(id=''){
 const item=rascunho.find(x=>x.id===id);
 $('planejadoId').value=item?.id||'';$('planejadoNome').value=item?.nome||'';$('planejadoQtd').value=item?.quantidade||1;$('planejadoUn').value=item?.unidade||'un';
 $('tituloPlanejado').textContent=item?'Editar produto':'Adicionar produto';$('sugestoesProdutos').classList.add('oculto');$('sugestoesProdutos').innerHTML='';abrir(el.modalPlan);setTimeout(()=>$('planejadoNome').focus(),50);
}

function produtosDoHistorico(){
 const mapa=new Map();
 historico.forEach(c=>c.comprados.forEach(i=>{
  const chave=norm(i.nome);if(!chave)return;
  if(!mapa.has(chave))mapa.set(chave,{nome:i.nome,unidade:i.unidade,valorUnitario:i.valorUnitario,data:c.dataFinalizacao});
 }));
 return [...mapa.values()].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
}
function renderSugestoesProdutos(){
 const box=$('sugestoesProdutos'),termo=norm($('planejadoNome').value),produtos=produtosDoHistorico().filter(p=>!termo||norm(p.nome).includes(termo)).slice(0,8);
 if(!produtos.length){box.classList.add('oculto');box.innerHTML='';return}
 box.innerHTML=produtos.map(p=>`<button type="button" class="sugestao-produto" onclick="selecionarProdutoHistorico('${encodeURIComponent(p.nome)}','${encodeURIComponent(p.unidade)}')"><span><strong>${esc(p.nome)}</strong><small>Última compra: ${moeda(p.valorUnitario)} · ${data(p.data)}</small></span><b>Selecionar</b></button>`).join('');
 box.classList.remove('oculto');
}
function selecionarProdutoHistorico(nome,unidade){
 $('planejadoNome').value=decodeURIComponent(nome);$('planejadoUn').value=decodeURIComponent(unidade);$('sugestoesProdutos').classList.add('oculto');$('planejadoQtd').focus();
}

function renderRascunho(){
 el.vazioPlan.classList.toggle('oculto',rascunho.length>0);
 el.listaPlan.innerHTML=rascunho.map(x=>`<article class="item-planejado"><div><strong>${esc(x.nome)}</strong><div class="meta">${fmtQtd(x.quantidade)} ${esc(x.unidade)}</div></div><div class="acoes-item"><button class="mini" onclick="editarPlan('${x.id}')">Editar</button><button class="mini perigo" onclick="removerPlan('${x.id}')">Excluir</button></div></article>`).join('');
}
function criarLista(){
 const nome=el.nomeLista.value.trim(),mercado=el.mercado.value.trim();
 if(!nome)return toast('Informe o nome da lista.');
 if(!mercado)return toast('Informe o nome do mercado.');
 if(!rascunho.length)return toast('Adicione pelo menos um produto.');
 atual={id:uid(),nome,mercado,dataCriacao:new Date().toISOString(),status:'em_compra',planejados:JSON.parse(JSON.stringify(rascunho)),comprados:[]};
 rascunho=[];salvar();mostrarAtual();renderCompra();
}
function renderCompra(){
 if(!atual)return mostrarAtual();
 el.compraNome.textContent=atual.nome;el.compraMercado.textContent=atual.mercado;
 el.listaCompra.innerHTML=atual.planejados.map(p=>{
  const c=atual.comprados.find(x=>x.planejadoId===p.id),comp=c?compararPreco(c):'';
  return `<article class="item-compra ${c?'pego':''}"><button class="check" onclick="acaoPegar('${p.id}')">✓</button><div><strong>${esc(p.nome)}</strong><div class="meta"><span>Planejado: ${fmtQtd(p.quantidade)} ${esc(p.unidade)}</span>${c?`<span>Comprado: ${fmtQtd(c.quantidade)} ${esc(c.unidade)}</span>`:''}</div>${comp}</div><div class="valor">${c?`<strong>${moeda(c.quantidade*c.valorUnitario)}</strong><small>${moeda(c.valorUnitario)} / ${esc(c.unidade)}</small><div class="acoes-item"><button class="mini" onclick="abrirPegar('${p.id}')">Alterar</button><button class="mini perigo" onclick="desmarcar('${p.id}')">Remover</button></div>`:'<small>Pendente</small>'}</div></article>`;
 }).join('');
 const extras=atual.comprados.filter(x=>x.extra);
 el.blocoExtras.classList.toggle('oculto',!extras.length);
 el.listaExtras.innerHTML=extras.map(x=>`<article class="item-extra"><div><strong>${esc(x.nome)} <span class="badge">EXTRA</span></strong><div class="meta">${fmtQtd(x.quantidade)} ${esc(x.unidade)} × ${moeda(x.valorUnitario)}</div>${compararPreco(x)}</div><div class="valor"><strong>${moeda(x.quantidade*x.valorUnitario)}</strong><div class="acoes-item"><button class="mini perigo" onclick="removerExtra('${x.id}')">Excluir</button></div></div></article>`).join('');
 const pegos=atual.comprados.filter(x=>!x.extra).length,total=totalAtual();
 el.total.textContent=el.totalRodape.textContent=moeda(total);el.progresso.textContent=`${pegos} / ${atual.planejados.length}`;el.extras.textContent=extras.length;el.barra.style.width=`${atual.planejados.length?pegos/atual.planejados.length*100:0}%`;
}
function abrirPegar(id){
 const p=atual.planejados.find(x=>x.id===id),c=atual.comprados.find(x=>x.planejadoId===id);
 $('pegarId').value=id;$('pegarNome').textContent=p.nome;$('pegarQtd').value=c?.quantidade||p.quantidade;$('pegarValor').value=c?.valorUnitario??'';
 const ant=ultimoPreco(p.nome);$('hintPreco').textContent=ant?`Última compra: ${moeda(ant.valorUnitario)} em ${data(ant.data)}.`:'Sem histórico de preço para este produto.';
 abrir(el.modalPegar);setTimeout(()=>$('pegarValor').focus(),50);
}
function acaoPegar(id){const c=atual.comprados.find(x=>x.planejadoId===id);c?desmarcar(id):abrirPegar(id)}
function desmarcar(id){atual.comprados=atual.comprados.filter(x=>x.planejadoId!==id);salvar();renderCompra()}
function removerExtra(id){atual.comprados=atual.comprados.filter(x=>x.id!==id);salvar();renderCompra()}
function compararPreco(item){
 const ant=ultimoPreco(item.nome);if(!ant)return '';
 const d=item.valorUnitario-ant.valorUnitario,p=ant.valorUnitario?d/ant.valorUnitario*100:0,cl=Math.abs(d)<.005?'igual':d>0?'alta':'baixa',s=Math.abs(d)<.005?'→':d>0?'↑':'↓';
 return `<span class="comparacao ${cl}">${s} ${Math.abs(p).toFixed(1).replace('.',',')}% vs. última compra</span>`;
}
function abrirFinal(){
 if(!atual)return;
 const pegos=atual.comprados.filter(x=>!x.extra),falt=atual.planejados.filter(p=>!pegos.some(c=>c.planejadoId===p.id)),extras=atual.comprados.filter(x=>x.extra),difq=pegos.filter(c=>{const p=atual.planejados.find(x=>x.id===c.planejadoId);return p&&Math.abs(p.quantidade-c.quantidade)>.0001});
 $('fimPlanejados').textContent=atual.planejados.length;$('fimPegos').textContent=pegos.length;$('fimFaltaram').textContent=falt.length;$('fimExtras').textContent=extras.length;$('fimTotalApp').textContent=moeda(totalAtual());$('fimDocumento').value='';
 blocoFinal('fimFaltantesBloco','fimFaltantes',falt.map(x=>`<div class="linha-final"><span>${esc(x.nome)}</span><strong>${fmtQtd(x.quantidade)} ${esc(x.unidade)}</strong></div>`).join(''),falt.length);
 blocoFinal('fimQuantidadeBloco','fimQuantidade',difq.map(c=>{const p=atual.planejados.find(x=>x.id===c.planejadoId);const d=c.quantidade-p.quantidade;return `<div class="linha-final"><span>${esc(c.nome)} — planejado ${fmtQtd(p.quantidade)}, comprado ${fmtQtd(c.quantidade)}</span><strong>${d>0?'+':''}${fmtQtd(d)} ${esc(c.unidade)}</strong></div>`}).join(''),difq.length);
 blocoFinal('fimExtrasBloco','fimListaExtras',extras.map(x=>`<div class="linha-final"><span>${esc(x.nome)} — ${fmtQtd(x.quantidade)} ${esc(x.unidade)}</span><strong>${moeda(x.quantidade*x.valorUnitario)}</strong></div>`).join(''),extras.length);
 $('fimDivergencia').className='divergencia neutro';$('fimDivergencia').textContent='Informe o total do documento fiscal.';abrir(el.modalFim);
}
function blocoFinal(bloco,conteudo,html,tem){$(bloco).classList.toggle('oculto',!tem);$(conteudo).innerHTML=html}
function divergencia(){
 const raw=$('fimDocumento').value;if(raw===''){ $('fimDivergencia').className='divergencia neutro';$('fimDivergencia').textContent='Informe o total do documento fiscal.';return}
 const doc=Number(raw),d=doc-totalAtual();
 if(Math.abs(d)<.005){$('fimDivergencia').className='divergencia ok';$('fimDivergencia').textContent='✓ O documento fiscal confere com o total registrado.'}
 else{$('fimDivergencia').className='divergencia erro';$('fimDivergencia').textContent=`Divergência de ${moeda(Math.abs(d))}. O documento está ${d>0?'acima':'abaixo'} do total registrado.`}
}
function salvarCompra(){
 const raw=$('fimDocumento').value;if(raw==='')return toast('Informe o total do documento fiscal.');
 const doc=Number(raw),pegos=atual.comprados.filter(x=>!x.extra),falt=atual.planejados.filter(p=>!pegos.some(c=>c.planejadoId===p.id)),extras=atual.comprados.filter(x=>x.extra);
 historico.unshift({...atual,status:'finalizada',dataFinalizacao:new Date().toISOString(),totalApp:totalAtual(),totalDocumento:doc,diferenca:doc-totalAtual(),faltantes:falt.length,extrasQtd:extras.length});
 atual=null;localStorage.removeItem(K_ATUAL);localStorage.setItem(K_HIST,JSON.stringify(historico));fechar(el.modalFim);mostrarHistorico();renderHistorico();toast('Compra salva no histórico.');
}
function renderHistorico(){
 $('vazioHistorico').classList.toggle('oculto',historico.length>0);
 $('listaHistorico').innerHTML=historico.map(c=>`<article class="historico-item"><div><strong>${esc(c.nome)}</strong><p>${esc(c.mercado)} · ${data(c.dataFinalizacao)} · ${c.faltantes} faltantes · ${c.extrasQtd} extras</p></div><div class="valor"><strong>${moeda(c.totalApp)}</strong><button class="mini" onclick="detalhe('${c.id}')">Ver compra</button></div></article>`).join('');
}
function detalhe(id){
 const c=historico.find(x=>x.id===id);if(!c)return;$('detalheTitulo').textContent=`${c.nome} — ${c.mercado}`;
 const pegos=c.comprados.filter(x=>!x.extra),extras=c.comprados.filter(x=>x.extra),falt=c.planejados.filter(p=>!pegos.some(x=>x.planejadoId===p.id));
 $('detalheConteudo').innerHTML=`<div class="resumo-final"><article><span>Total app</span><strong>${moeda(c.totalApp)}</strong></article><article><span>Documento</span><strong>${moeda(c.totalDocumento)}</strong></article><article><span>Faltaram</span><strong>${falt.length}</strong></article><article><span>Extras</span><strong>${extras.length}</strong></article></div><div class="secao-final"><h3>Itens comprados</h3>${c.comprados.map(x=>`<div class="linha-final"><span>${esc(x.nome)} ${x.extra?'<span class="badge">EXTRA</span>':''}</span><strong>${fmtQtd(x.quantidade)} ${esc(x.unidade)} · ${moeda(x.quantidade*x.valorUnitario)}</strong></div>`).join('')}</div>${falt.length?`<div class="secao-final"><h3>Não comprados</h3>${falt.map(x=>`<div class="linha-final"><span>${esc(x.nome)}</span><strong>${fmtQtd(x.quantidade)} ${esc(x.unidade)}</strong></div>`).join('')}</div>`:''}`;
 abrir(el.modalDetalhe);
}
function ultimoPreco(nome){
 const n=norm(nome);for(const c of historico){const i=c.comprados.find(x=>norm(x.nome)===n);if(i)return{valorUnitario:i.valorUnitario,data:c.dataFinalizacao}}return null
}
function totalAtual(){return atual?atual.comprados.reduce((s,x)=>s+x.quantidade*x.valorUnitario,0):0}
function excluirLista(){if(!atual||!confirm('Excluir a lista atual?'))return;atual=null;localStorage.removeItem(K_ATUAL);mostrarAtual();toast('Lista excluída.')}
function novaLista(){if(atual&&!confirm('Excluir a lista atual e criar uma nova?'))return;atual=null;rascunho=[];localStorage.removeItem(K_ATUAL);el.nomeLista.value='';el.mercado.value='';renderRascunho();mostrarAtual()}
function mostrarAtual(){$('telaInformacoes').classList.add('oculto');el.hist.classList.add('oculto');$('navHistorico').classList.remove('ativo');$('navInformacoes').classList.remove('ativo');$('navAtual').classList.add('ativo');if(atual){el.criacao.classList.add('oculto');el.compra.classList.remove('oculto');renderCompra()}else{el.compra.classList.add('oculto');el.criacao.classList.remove('oculto')} }
function mostrarHistorico(){$('telaInformacoes').classList.add('oculto');el.criacao.classList.add('oculto');el.compra.classList.add('oculto');el.hist.classList.remove('oculto');$('navAtual').classList.remove('ativo');$('navInformacoes').classList.remove('ativo');$('navHistorico').classList.add('ativo');$('btnVoltarAtual').classList.toggle('oculto',!atual);renderHistorico()}
function salvar(){localStorage.setItem(K_ATUAL,JSON.stringify(atual));localStorage.setItem(K_HIST,JSON.stringify(historico))}
function abrir(m){m.classList.remove('oculto');document.body.style.overflow='hidden'}
function fechar(m){m.classList.add('oculto');if(!document.querySelector('.modal:not(.oculto)'))document.body.style.overflow=''}
function ler(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function moeda(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function fmtQtd(v){return Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2})}
function data(v){return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()}
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;")}
let tt;function toast(t){clearTimeout(tt);el.toast.textContent=t;el.toast.classList.add('show');tt=setTimeout(()=>el.toast.classList.remove('show'),2400)}
window.selecionarProdutoHistorico=selecionarProdutoHistorico;window.editarPlan=id=>abrirPlanejado(id);window.removerPlan=id=>{rascunho=rascunho.filter(x=>x.id!==id);renderRascunho()};window.acaoPegar=acaoPegar;window.abrirPegar=abrirPegar;window.desmarcar=desmarcar;window.removerExtra=removerExtra;window.detalhe=detalhe;

function mostrarInformacoes(){
 el.criacao.classList.add('oculto');el.compra.classList.add('oculto');el.hist.classList.add('oculto');$('telaInformacoes').classList.remove('oculto');
 $('navAtual').classList.remove('ativo');$('navHistorico').classList.remove('ativo');$('navInformacoes').classList.add('ativo');
}
let installPrompt=null;
const emApp=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
function atualizarInstalacao(){
 const pode=!!installPrompt&&!emApp();$('btnInstalarInfo').classList.toggle('oculto',!pode);
 if(pode&&window.innerWidth<=900&&!sessionStorage.getItem('install_pwa_adiado'))$('installBanner').classList.remove('oculto');
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;atualizarInstalacao()});
async function instalarPWA(){if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBanner').classList.add('oculto');atualizarInstalacao()}
$('btnInstalar').onclick=instalarPWA;$('btnInstalarInfo').onclick=instalarPWA;
$('btnDepoisInstalar').onclick=()=>{sessionStorage.setItem('install_pwa_adiado','1');$('installBanner').classList.add('oculto')};
window.addEventListener('appinstalled',()=>{installPrompt=null;$('installBanner').classList.add('oculto');toast('Aplicativo instalado.');atualizarInstalacao()});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));

renderRascunho();mostrarAtual();