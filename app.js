(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const PAGES = document.body.getAttribute('data-page') || '';
  const STORAGE_KEY = 'grieveda.complaints';
  const USER_KEY = 'grieveda.user';

  const now = () => new Date().toISOString();
  const uid = () => 'C-' + Math.random().toString(36).slice(2,8).toUpperCase();

  function getData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch{ return []; }
  }
  function setData(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  function seed(){
    if(getData().length) return;
    const sample = [
      {
        id: uid(), title:'Pothole near city hospital', description:'Large pothole causing traffic',
        category:'Roads', department:'Public Works', status:'Pending', createdAt: now(), updatedAt: now(),
        location:'MG Road', image:null, isPublic:true, upvotes:7
      },
      {
        id: uid(), title:'Overflowing garbage bin', description:'Needs immediate cleaning',
        category:'Sanitation', department:'Sanitation Dept.', status:'In Progress', createdAt: now(), updatedAt: now(),
        location:'Sector 12', image:null, isPublic:true, upvotes:14
      },
      {
        id: uid(), title:'Frequent power cuts', description:'Power outage in evenings',
        category:'Electricity', department:'Electricity Board', status:'Resolved', createdAt: now(), updatedAt: now(),
        location:'Green Park', image:null, isPublic:false, upvotes:0
      }
    ];
    setData(sample);
  }

  // Navigation toggle
  function setupNav(){
    const toggle = $('.nav-toggle');
    const menu = $('#mobile-menu');
    if(!toggle || !menu) return;
    toggle.addEventListener('click', ()=>{
      const open = menu.hasAttribute('hidden') ? false : true;
      if(open){ menu.setAttribute('hidden',''); toggle.setAttribute('aria-expanded','false'); }
      else { menu.removeAttribute('hidden'); toggle.setAttribute('aria-expanded','true'); }
    });
  }

  // Home footer year
  function setYear(){ const y = $('#year'); if(y) y.textContent = new Date().getFullYear(); }

  // Image preview
  function setupImagePreview(){
    const input = $('#image');
    const wrap = $('#imagePreview');
    if(!input || !wrap) return;
    input.addEventListener('change', ()=>{
      wrap.innerHTML = '';
      const files = Array.from(input.files || []);
      files.forEach(file=>{
        const reader = new FileReader();
        reader.onload = e=>{
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = 'Selected evidence image';
          wrap.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Simple keyword-based classifier
  function classifyText(text){
    const t = (text||'').toLowerCase();
    if(/pothole|road|street|footpath|speed breaker/.test(t)) return 'Roads';
    if(/trash|garbage|waste|bin|clean|sanitation/.test(t)) return 'Sanitation';
    if(/power|electric|transformer|light|outage|load shedding/.test(t)) return 'Electricity';
    if(/water|pipeline|leak|sewage|supply|tap/.test(t)) return 'Water';
    return 'Other';
  }

  function mapDept(category){
    switch(category){
      case 'Roads': return 'Public Works';
      case 'Sanitation': return 'Sanitation Dept.';
      case 'Electricity': return 'Electricity Board';
      case 'Water': return 'Water Supply';
      default: return '';
    }
  }

  // Report page
  function setupReport(){
    const form = $('#reportForm');
    if(!form) return;
    const desc = $('#description');
    const cat = $('#category');
    const dept = $('#department');
    const autoBtn = $('#autoClassify');

    autoBtn?.addEventListener('click', ()=>{
      const c = classifyText(desc.value + ' ' + $('#title').value);
      cat.value = c;
      if(!dept.value) dept.value = mapDept(c);
    });

    cat.addEventListener('change', ()=>{
      if(!dept.value){ dept.value = mapDept(cat.value); }
    });

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const f = new FormData(form);
      let imgData = null;
      const file = $('#image').files?.[0];
      if(file){
        imgData = await new Promise((res)=>{
          const r = new FileReader();
          r.onload = e=>res(e.target.result);
          r.readAsDataURL(file);
        });
      }
      const category = f.get('category') || classifyText(f.get('description'));
      const complaint = {
        id: uid(),
        title: f.get('title'),
        description: f.get('description'),
        category: category,
        department: f.get('department') || mapDept(category),
        location: f.get('location') || '',
        image: imgData,
        isPublic: !!f.get('isPublic'),
        upvotes: 0,
        status: 'Pending',
        createdAt: now(),
        updatedAt: now()
      };
      const list = getData(); list.unshift(complaint); setData(list);
      alert('Complaint submitted! Your Complaint ID is ' + complaint.id);
      window.location.href = 'citizen-dashboard.html';
    });
  }

  // Citizen dashboard
  function setupCitizen(){
    const listEl = $('#citizenList');
    const emptyEl = $('#emptyCitizen');
    if(!listEl) return;
    const statusSel = $('#filterStatus');
    const catSel = $('#filterCategory');

    function render(){
      const status = statusSel.value;
      const cat = catSel.value;
      const list = getData().filter(c=>{
        return (!status || c.status === status) && (!cat || c.category === cat);
      });
      listEl.innerHTML = '';
      if(!list.length){ emptyEl.hidden = false; return; }
      emptyEl.hidden = true;
      list.forEach(c=>{
        const card = document.createElement('div'); card.className = 'card';
        card.innerHTML = `
          <div class="card-head" style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.25rem">
            <h3>${c.title}</h3>
            <span class="badge" data-status="${c.status}">${c.status}</span>
          </div>
          <p class="muted" style="margin:.25rem 0">ID: ${c.id}</p>
          <p>${c.description}</p>
          <p class="muted">Category: ${c.category} · Dept: ${c.department}</p>
          ${c.image ? `<img src="${c.image}" alt="Complaint image" style="margin-top:.5rem;border-radius:8px;border:1px solid var(--color-muted)" />` : ``}
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem">
            <a class="btn btn-ghost" href="track.html">Track</a>
            ${c.isPublic ? `<span class="badge" title="Community upvotes">▲ ${c.upvotes}</span>` : ``}
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    statusSel.addEventListener('change', render);
    catSel.addEventListener('change', render);
    render();
  }

  // Admin dashboard
  function setupAdmin(){
    const tbody = $('#adminTable');
    if(!tbody) return;
    const deptFilter = $('#deptFilter');
    const statusFilter = $('#statusFilter');

    function row(c){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.title}</td>
        <td>${c.department || '-'}</td>
        <td>${c.category}</td>
        <td>
          <span class="badge" data-status="${c.status}">${c.status}</span>
        </td>
        <td>${new Date(c.updatedAt).toLocaleString()}</td>
        <td>
          <label class="sr-only" for="s-${c.id}">Update status</label>
          <select id="s-${c.id}">
            <option ${c.status==='Pending'?'selected':''}>Pending</option>
            <option ${c.status==='In Progress'?'selected':''}>In Progress</option>
            <option ${c.status==='Resolved'?'selected':''}>Resolved</option>
          </select>
        </td>
      `;
      const sel = $('select', tr);
      sel.addEventListener('change', ()=>{
        const list = getData();
        const idx = list.findIndex(x=>x.id===c.id);
        if(idx>-1){
          list[idx].status = sel.value;
          list[idx].updatedAt = now();
          setData(list);
          render(); // re-render
        }
      });
      return tr;
    }

    function render(){
      const d = deptFilter.value;
      const s = statusFilter.value;
      const list = getData().filter(c=>{
        return (!d || c.department === d) && (!s || c.status === s);
      });
      tbody.innerHTML = '';
      list.forEach(c=> tbody.appendChild(row(c)));
    }

    deptFilter.addEventListener('change', render);
    statusFilter.addEventListener('change', render);
    render();
  }

  // Track by ID
  function setupTrack(){
    const form = $('#trackForm');
    if(!form) return;
    const out = $('#trackResult');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const id = $('#trackId').value.trim();
      const c = getData().find(x=>x.id===id);
      if(!c){
        out.innerHTML = `<p class="muted">No complaint found for ID: ${id}</p>`;
        return;
      }
      out.innerHTML = `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>${c.title}</h3>
            <span class="badge" data-status="${c.status}">${c.status}</span>
          </div>
          <p class="muted">ID: ${c.id} · ${new Date(c.updatedAt).toLocaleString()}</p>
          <p>${c.description}</p>
          <p class="muted">Category: ${c.category} · Dept: ${c.department}${c.location?` · Location: ${c.location}`:''}</p>
          ${c.image ? `<img src="${c.image}" alt="Complaint image" style="margin-top:.5rem;border-radius:8px;border:1px solid var(--color-muted)" />` : ``}
          <ol style="margin:.5rem 0 0 1rem">
            <li>Pending</li>
            <li${c.status==='In Progress'||c.status==='Resolved'?' style="font-weight:600;color:var(--color-primary)"':''}>In Progress</li>
            <li${c.status==='Resolved'?' style="font-weight:700;color:var(--color-accent)"':''}>Resolved</li>
          </ol>
        </div>
      `;
    });
  }

  // Community feed
  function setupCommunity(){
    const listEl = $('#communityList');
    if(!listEl) return;
    const catSel = $('#commCategory');
    const sortSel = $('#commSort');
    const emptyEl = $('#emptyCommunity');

    function upvote(id){
      const list = getData();
      const idx = list.findIndex(c=>c.id===id);
      if(idx>-1){ list[idx].upvotes += 1; setData(list); render(); }
    }

    function render(){
      const cat = catSel.value;
      let list = getData().filter(c=>c.isPublic);
      if(cat) list = list.filter(c=>c.category===cat);
      if(sortSel.value==='top'){ list.sort((a,b)=>b.upvotes-a.upvotes || b.createdAt.localeCompare(a.createdAt)); }
      else { list.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }

      listEl.innerHTML = '';
      if(!list.length){ emptyEl.hidden = false; return; }
      emptyEl.hidden = true;

      list.forEach(c=>{
        const card = document.createElement('div'); card.className='card';
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>${c.title}</h3>
            <span class="badge" data-status="${c.status}">${c.status}</span>
          </div>
          <p class="muted">ID: ${c.id} · ${new Date(c.createdAt).toLocaleDateString()}</p>
          <p>${c.description}</p>
          <p class="muted">Category: ${c.category} · Dept: ${c.department}</p>
          ${c.image ? `<img src="${c.image}" alt="Complaint image" style="margin-top:.5rem;border-radius:8px;border:1px solid var(--color-muted)" />` : ``}
          <div style="display:flex;gap:.5rem;align-items:center;margin-top:.5rem">
            <button class="btn" data-variant="primary" data-upvote="${c.id}" aria-label="Upvote complaint ${c.id}">▲ Upvote</button>
            <span class="badge" title="Upvotes">▲ ${c.upvotes}</span>
            <a class="btn btn-ghost" href="track.html">Track</a>
          </div>
        `;
        listEl.appendChild(card);
      });

      $$('button[data-upvote]').forEach(btn=>{
        btn.addEventListener('click', ()=> upvote(btn.getAttribute('data-upvote')));
      });
    }

    catSel.addEventListener('change', render);
    sortSel.addEventListener('change', render);
    render();
  }

  // Login/Register (demo-only)
  function setupAuth(){
    const loginForm = $('#loginForm');
    const registerForm = $('#registerForm');

    if(registerForm){
      registerForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const name = $('#name').value.trim();
        const email = $('#regEmail').value.trim();
        const p1 = $('#regPassword').value;
        const p2 = $('#regPassword2').value;
        if(p1 !== p2){ alert('Passwords do not match'); return; }
        localStorage.setItem(USER_KEY, JSON.stringify({name, email}));
        alert('Registered! (Demo only)');
        window.location.href = 'report.html';
      });
    }
    if(loginForm){
      loginForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const email = $('#email').value.trim();
        localStorage.setItem(USER_KEY, JSON.stringify({email}));
        alert('Logged in! (Demo only)');
        window.location.href = 'citizen-dashboard.html';
      });
    }

    // Face auth preview (camera open/close)
    const faceBtn = $('#faceAuthBtn');
    const camera = $('#camera');
    const video = $('#cameraStream');
    const closeCam = $('#closeCamera');
    let stream = null;

    async function openCamera(){
      try{
        stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
        video.srcObject = stream;
        camera.hidden = false;
      }catch(err){
        alert('Camera permission denied or unavailable.');
      }
    }
    function closeCamera(){
      if(stream){ stream.getTracks().forEach(t=>t.stop()); stream = null; }
      camera.hidden = true;
    }

    faceBtn?.addEventListener('click', openCamera);
    closeCam?.addEventListener('click', closeCamera);
  }

  // Init
  function init(){
    seed();
    setupNav();
    setYear();
    setupImagePreview();
    setupReport();
    setupCitizen();
    setupAdmin();
    setupTrack();
    setupCommunity();
    setupAuth();
  }

  document.addEventListener('DOMContentLoaded', init);
})();