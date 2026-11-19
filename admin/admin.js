(() => {
  const $=id=>document.getElementById(id);
  const KEY="birthdayWishlistAdminSettings";
  const PRIVATE_STATUS_KEY="birthdayWishlistPrivateReceived";
  let settings={owner:"",repo:"",branch:"main",token:""},products=[],dataSha=null,editingImage=null;
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const msg=(id,s)=>$(id).textContent=s;
  function saved(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
  function loadSettings(){
    const s=saved();$("gh-owner").value=s.owner||"";$("gh-repo").value=s.repo||"";$("gh-branch").value=s.branch||"main";
    if(s.token){$("gh-token").value=s.token;$("remember-token").checked=true}
  }
  function currentSettings(){return {owner:$("gh-owner").value.trim(),repo:$("gh-repo").value.trim(),branch:$("gh-branch").value.trim()||"main",token:$("gh-token").value.trim()}}
  function repoApi(){return `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}`}
  function api(path){return `${repoApi()}/contents/${path}`}
  async function request(url,opts={}){
    const r=await fetch(url,{...opts,headers:{"Accept":"application/vnd.github+json","Authorization":`Bearer ${settings.token}`,"X-GitHub-Api-Version":"2022-11-28",...(opts.headers||{})}});
    const body=await r.json().catch(()=>({}));
    if(!r.ok){const error=new Error(`GitHub API ${r.status}: ${body.message||r.statusText||"Unknown error"}`);error.status=r.status;error.url=url;throw error;}
    return body;
  }
  async function verifyConnection(){
    await request(repoApi());
    const branch=await request(`${repoApi()}/branches/${encodeURIComponent(settings.branch)}`);
    if(branch.name!==settings.branch)throw new Error(`The repository branch is ${branch.name}, not ${settings.branch}.`);
  }
  async function readFile(path){
    try{const f=await request(api(path)+`?ref=${encodeURIComponent(settings.branch)}`);return {text:decodeURIComponent(escape(atob(f.content.replace(/\n/g,"")))),sha:f.sha}}
    catch(e){if(e.status===404)return {text:null,sha:null};throw e}
  }
  async function writeFile(path,content,sha,message){
    const body={message,content:btoa(unescape(encodeURIComponent(content))),branch:settings.branch};
    if(sha)body.sha=sha;
    return request(api(path),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  }
  async function loadWishlist(){
    const f=await readFile("wishlist.json");dataSha=f.sha;
    if(f.text){const d=JSON.parse(f.text);products=Array.isArray(d.products)?d.products:[]}
    else products=[];
    let privateStatus={};try{privateStatus=JSON.parse(localStorage.getItem(PRIVATE_STATUS_KEY)||"{}")}catch{}
    products=products.map(p=>({...p,received:!!privateStatus[p.id]}));
    $("setup-panel").hidden=true;$("workspace").hidden=false;
    $("repo-label").textContent=`${settings.owner}/${settings.repo} · ${settings.branch}`;
    renderAdmin();
  }
  $("connect-btn").addEventListener("click",async()=>{
    settings=currentSettings();
    if(!settings.owner||!settings.repo||!settings.token){msg("connect-message","Please fill in your GitHub username, repository, and token.");return}
    msg("connect-message","Connecting…");$("connect-btn").disabled=true;
    try{
      await verifyConnection();
      await loadWishlist();
      if($("remember-token").checked)localStorage.setItem(KEY,JSON.stringify(settings));
      else{const {owner,repo,branch}=settings;localStorage.setItem(KEY,JSON.stringify({owner,repo,branch}));}
      msg("connect-message","");
    }catch(e){msg("connect-message",e.message);$("workspace").hidden=true;$("setup-panel").hidden=false}
    finally{$("connect-btn").disabled=false}
  });
  $("forget-token").addEventListener("click",()=>{const s=saved();delete s.token;localStorage.setItem(KEY,JSON.stringify(s));$("gh-token").value="";$("remember-token").checked=false;msg("connect-message","Saved token removed from this device.")});
  $("disconnect-btn").addEventListener("click",()=>{$("workspace").hidden=true;$("setup-panel").hidden=false;settings={owner:"",repo:"",branch:"main",token:""}});
  $("refresh-btn").addEventListener("click",async()=>{try{settings=currentSettingsFromSession();await loadWishlist();msg("save-message","Wishlist refreshed.")}catch(e){msg("save-message",e.message)}});
  function currentSettingsFromSession(){return settings}
  function addLinkRow(label="",url=""){
    const div=document.createElement("div");div.className="link-row";
    div.innerHTML=`<input class="link-label" placeholder="Button label (e.g. Amazon)" value="${esc(label)}"><input class="link-url" type="url" placeholder="https://…" value="${esc(url)}"><button type="button" class="remove-link" aria-label="Remove link">×</button>`;
    div.querySelector("button").onclick=()=>div.remove();$("links-list").appendChild(div);
  }
  $("add-link").onclick=()=>addLinkRow();
  function getLinks(){return [...$("links-list").querySelectorAll(".link-row")].map(r=>({label:r.querySelector(".link-label").value.trim(),url:r.querySelector(".link-url").value.trim()})).filter(x=>x.url)}
  function resetForm(){
    $("product-form").reset();$("product-id").value="";$("p-quantity").value=1;$("p-priority").value="Medium";$("p-order").value=products.length;
    $("links-list").innerHTML="";addLinkRow();$("image-preview").hidden=true;$("editor-title").textContent="Add a gift";$("save-product").textContent="Save gift";$("cancel-edit").hidden=true;editingImage=null;
  }
  $("cancel-edit").onclick=resetForm;
  $("p-image-file").addEventListener("change",()=>{
    const file=$("p-image-file").files[0];if(!file)return;
    const url=URL.createObjectURL(file);$("image-preview").innerHTML=`<img src="${url}" alt="Image preview">`;$("image-preview").hidden=false;
  });
  function renderAdmin(){
    $("admin-count").textContent=products.length;
    $("admin-list").innerHTML=products.length?products.slice().sort((a,b)=>(a.order??0)-(b.order??0)).map(p=>`<div class="admin-item"><img class="admin-thumb" src="${p.image?"../"+esc(p.image):""}" onerror="this.style.visibility='hidden'" alt=""><div><strong>${esc(p.name)}</strong><small>${esc(p.category||"Uncategorized")} · ${esc(p.priority||"Medium")} · Qty ${Number(p.quantity)||1}${p.received?" · Received (private)":""}</small></div><div class="admin-actions"><button data-edit="${esc(p.id)}">Edit</button><button class="delete" data-delete="${esc(p.id)}">Delete</button></div></div>`).join(""):'<p class="muted">No gifts yet. Add your first one!</p>';
    $("admin-list").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));
    $("admin-list").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
  }
  function editProduct(id){
    const p=products.find(x=>x.id===id);if(!p)return;
    $("product-id").value=p.id;$("p-name").value=p.name||"";$("p-price").value=p.price??"";$("p-currency").value=p.currency||"USD";$("p-quantity").value=p.quantity||1;$("p-priority").value=p.priority||"Medium";$("p-category").value=p.category||"";$("p-order").value=p.order??0;$("p-description").value=p.description||"";$("p-image-url").value=p.image&&!p.image.startsWith("images/")?p.image:"";$("p-received").checked=!!p.received;
    $("links-list").innerHTML="";(p.links||[]).forEach(l=>addLinkRow(l.label,l.url));if(!(p.links||[]).length)addLinkRow();
    editingImage=p.image||null;$("editor-title").textContent="Edit gift";$("save-product").textContent="Update gift";$("cancel-edit").hidden=false;
    if(p.image){$("image-preview").innerHTML=`<img src="../${esc(p.image)}" alt="Current image">`;$("image-preview").hidden=false}
    window.scrollTo({top:0,behavior:"smooth"});
  }
  async function uploadImage(file){
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
    if(file.size>5*1024*1024)throw new Error("Please use an image smaller than 5 MB.");
    const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
    const content=dataUrl.split(",")[1],path=`images/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    await request(api(path),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:`Add wishlist image ${path.split("/").pop()}`,content,branch:settings.branch})});
    return path;
  }
  $("product-form").addEventListener("submit",async e=>{
    e.preventDefault();const id=$("product-id").value||`gift-${Date.now()}`;const old=products.find(p=>p.id===id);
    const save=$("save-product");save.disabled=true;msg("save-message","Saving to GitHub…");
    try{
      let image=$("p-image-url").value.trim()||editingImage;
      const file=$("p-image-file").files[0];if(file)image=await uploadImage(file);
      const p={id,name:$("p-name").value.trim(),price:$("p-price").value===""?null:Number($("p-price").value),currency:$("p-currency").value,quantity:Math.max(1,Number($("p-quantity").value)||1),priority:$("p-priority").value,category:$("p-category").value.trim(),order:Number($("p-order").value)||0,description:$("p-description").value.trim(),image,links:getLinks(),received:$("p-received").checked};
      const previous=products;
      products=old?products.map(x=>x.id===id?p:x):[...products,p];
      try{await publish()}catch(err){products=previous;throw err}
      renderAdmin();resetForm();msg("save-message","Saved! GitHub Pages may take a minute or two to update.");
    }catch(err){msg("save-message",`${err.message}. Verify owner GoodGamer-2222, repository wishlist, branch main, and token Contents: Read and write.`)}
    finally{save.disabled=false}
  });
  async function publish(){
    const privateStatus={};products.forEach(p=>{if(p.received)privateStatus[p.id]=true});
    localStorage.setItem(PRIVATE_STATUS_KEY,JSON.stringify(privateStatus));
    const publicProducts=products.map(({received,...p})=>p);
    const content=JSON.stringify({products:publicProducts},null,2);
    const result=await writeFile("wishlist.json",content,dataSha,"Update birthday wishlist");
    dataSha=result.content.sha;
  }
  async function deleteProduct(id){
    const p=products.find(x=>x.id===id);if(!p||!confirm(`Delete "${p.name}" from the wishlist?`))return;
    const previous=products;products=products.filter(x=>x.id!==id);
    try{await publish();renderAdmin();msg("save-message","Gift deleted.")}catch(e){products=previous;renderAdmin();msg("save-message",e.message)}
  }
  loadSettings();resetForm();
})();