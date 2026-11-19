(() => {
  const cfg=window.WISHLIST_CONFIG||{};
  const $=id=>document.getElementById(id);
  const money=(v,c)=>{if(v===null||v===undefined||v==="")return "Price not listed";try{return new Intl.NumberFormat(undefined,{style:"currency",currency:c||"USD"}).format(Number(v))}catch{return `${v} ${c||""}`}};
  $("site-title").textContent=cfg.title||"Birthday Wishlist";
  $("birthday-note").textContent=cfg.birthdayNote||"";
  $("intro-copy").textContent=cfg.intro||"A collection of birthday ideas. Thanks for taking a look!";
  $("footer-year").textContent=new Date().getFullYear();
  let products=[];
  const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  async function load(){
    try{
      const res=await fetch("wishlist.json?ts="+Date.now(),{cache:"no-store"});
      if(!res.ok)throw new Error("Wishlist data isn't published yet.");
      const data=await res.json();products=Array.isArray(data.products)?data.products:[];
      $("status").textContent=products.length?`${products.length} gift ideas`:"The wishlist is ready for its first additions.";
      render();
    }catch(e){products=[];$("status").textContent="The wishlist hasn't been published yet. Check back soon.";render();}
  }
  function render(){
    const q=$("search").value.trim().toLowerCase(),cat=$("category-filter").value,sort=$("sort").value;
    let list=products.filter(p=>(!q||[p.name,p.description,p.category].join(" ").toLowerCase().includes(q))&&(!cat||p.category===cat));
    if(sort==="priority")list.sort((a,b)=>({High:0,Medium:1,Low:2}[a.priority]??1)-({High:0,Medium:1,Low:2}[b.priority]??1));
    if(sort==="price-low")list.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));
    if(sort==="price-high")list.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));
    if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name));
    $("wishlist").innerHTML=list.map(p=>{
      const links=(p.links||[]).filter(x=>x.url).map((x,i)=>`<a class="product-link" href="${escapeHTML(x.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(x.label||`View option ${i+1}`)} ↗</a>`).join("");
      const img=p.image?`<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;image-placeholder&quot;>✧</span>'">`:`<span class="image-placeholder">✧</span>`;
      return `<article class="product-card"><div class="product-image">${img}</div><div class="product-content"><div class="card-top"><span class="category-tag">${escapeHTML(p.category||"WISHLIST")}</span><span class="priority-tag ${(p.priority||"Medium").toLowerCase()}">${escapeHTML(p.priority||"Medium")} priority</span></div><h3>${escapeHTML(p.name)}</h3><p class="description">${escapeHTML(p.description||"")}</p><div class="price-row"><span class="price">${money(p.price,p.currency||cfg.currency)}</span><span class="quantity">Wants ${Number(p.quantity)||1}</span></div><div class="card-actions">${links}</div></div></article>`;
    }).join("");
    $("empty-state").hidden=list.length!==0;
    $("item-count").textContent=`${products.length} ${products.length===1?"item":"items"}`;
    const total=products.reduce((s,p)=>s+(Number(p.price)||0)*(Number(p.quantity)||1),0);
    $("total-value").textContent=`Total listed value: ${money(total,cfg.currency||"USD")}`;
    const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();
    const current=$("category-filter").value;
    $("category-filter").innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
    $("category-filter").value=cats.includes(current)?current:"";
  }
  ["search","category-filter","sort"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",render));
  load();
})();