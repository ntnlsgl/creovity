(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const weekdays = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
  const statusLabels = {done:"Selesai", progress:"Dalam proses", waiting:"Menunggu"};
  const statusSymbols = {done:"✓", progress:"—", waiting:""};
  let currentDate = new Date(2026, 9, 1);
  let activeView = "calendar";
  let filterStatus = "all";
  let nextId = 13;
  let toastTimer;

  // Konten contoh untuk Oktober 2026. Status: centang = selesai, strip kuning = proses, kosong = menunggu.
  let contents = [
    {id:1,title:"Reels: 3 alasan konten butuh strategi",brand:"CreativeHub",platform:"Instagram",type:"Reels / Short Video",date:"2026-10-01",status:"done",owner:"Alya",brief:"Hook edukatif, jelaskan manfaat perencanaan konten."},
    {id:2,title:"Carousel: audit akun dalam 5 langkah",brand:"CreativeHub",platform:"Instagram",type:"Carousel",date:"2026-10-03",status:"progress",owner:"Raka",brief:"Slide 1 hook, slide 2–5 langkah audit, slide terakhir CTA."},
    {id:3,title:"Behind the scene: tim kreatif",brand:"CreativeHub",platform:"TikTok",type:"Reels / Short Video",date:"2026-10-05",status:"waiting",owner:"Dina",brief:"Cuplikan proses brainstorming dan produksi."},
    {id:4,title:"Dermaga Kopi: golden view",brand:"Dermaga Kopi",platform:"Instagram + TikTok",type:"Reels / Short Video",date:"2026-10-06",status:"done",owner:"Alya",brief:"Visual golden view dan pengalaman di dermaga."},
    {id:5,title:"Tips membuat hook 3 detik",brand:"CreativeHub",platform:"TikTok",type:"Reels / Short Video",date:"2026-10-08",status:"progress",owner:"Raka",brief:"Contoh hook before-after dengan teks layar."},
    {id:6,title:"Nocasta: bukan cuma soal senja",brand:"Nocasta Terrace",platform:"Instagram",type:"Reels / Short Video",date:"2026-10-10",status:"waiting",owner:"Dina",brief:"Tonjolkan ambience, menu, dan spot berkumpul."},
    {id:7,title:"Checklist sebelum publish konten",brand:"CreativeHub",platform:"Instagram",type:"Carousel",date:"2026-10-12",status:"done",owner:"Alya",brief:"Checklist visual, caption, CTA, tag, dan jadwal."},
    {id:8,title:"Tokohape: mitos battery health",brand:"Tokohape",platform:"TikTok",type:"Reels / Short Video",date:"2026-10-14",status:"progress",owner:"Raka",brief:"Edukasi singkat baterai iPhone tanpa hard selling."},
    {id:9,title:"Story polling: format favorit",brand:"CreativeHub",platform:"Instagram",type:"Story",date:"2026-10-17",status:"waiting",owner:"Dina",brief:"Polling Reels vs Carousel untuk audiens."},
    {id:10,title:"Studi kasus: ide menjadi campaign",brand:"CreativeHub",platform:"LinkedIn",type:"Carousel",date:"2026-10-21",status:"done",owner:"Alya",brief:"Alur dari insight, konsep, produksi, hingga evaluasi."},
    {id:11,title:"Dermaga Kopi: pengalaman speedboat",brand:"Dermaga Kopi",platform:"Instagram + TikTok",type:"Reels / Short Video",date:"2026-10-24",status:"progress",owner:"Raka",brief:"Fokus pengalaman wisata dan suasana Waduk Jatibarang."},
    {id:12,title:"Weekly recap: performa konten",brand:"CreativeHub",platform:"Instagram",type:"Single Post",date:"2026-10-29",status:"waiting",owner:"Dina",brief:"Ringkasan insight dan rencana eksperimen minggu depan."}
  ];

  const grid = $("#calendarGrid"), timeline = $("#timelineView"), list = $("#listView");
  const modal = $("#contentModal"), form = $("#contentForm");
  const dateInput = $("#contentDate");

  function pad(n){return String(n).padStart(2,"0")}
  function dateKey(date){return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`}
  function fromKey(key){const [y,m,d]=key.split("-").map(Number);return new Date(y,m-1,d)}
  function niceDate(key, includeYear=false){const d=fromKey(key);return `${d.getDate()} ${monthNames[d.getMonth()]}${includeYear?" "+d.getFullYear():""}`}
  function escapeHtml(value){return String(value??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function filteredContents(){return contents.filter(c=>filterStatus==="all"||c.status===filterStatus)}
  function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2600)}
  function updateStats(){
    $("#totalCount").textContent=contents.length;
    $("#doneCount").textContent=contents.filter(c=>c.status==="done").length;
    $("#progressCount").textContent=contents.filter(c=>c.status==="progress").length;
    $("#waitingCount").textContent=contents.filter(c=>c.status==="waiting").length;
    $("#visibleCount").textContent=`${filteredContents().length} konten ditampilkan`;
  }
  function eventMarkup(c, compact=false){
    return `<button class="event-chip ${c.status}" data-edit="${c.id}" title="${escapeHtml(c.title)} — ${statusLabels[c.status]}">${c.status==="waiting"?"":`<span class="event-mark">${statusSymbols[c.status]}</span>`}<span class="event-title">${escapeHtml(c.title)}</span></button>`;
  }
  function renderCalendar(){
    const y=currentDate.getFullYear(), m=currentDate.getMonth();
    $("#monthTitle").textContent=`${monthNames[m]} ${y}`;
    $("#monthSub").textContent="Jadwal publikasi dan progres produksi";
    const first=new Date(y,m,1), startOffset=first.getDay(), daysInMonth=new Date(y,m+1,0).getDate();
    const today=new Date(); const cells=Math.ceil((startOffset+daysInMonth)/7)*7;
    let out=weekdays.map(d=>`<div class="weekday">${d}</div>`).join("");
    for(let i=0;i<cells;i++){
      const dayNum=i-startOffset+1;
      const d=new Date(y,m,dayNum);
      const inMonth=d.getMonth()===m, key=dateKey(d);
      const dayContents=filteredContents().filter(c=>c.date===key);
      const isToday=key===dateKey(today);
      out+=`<div class="day-cell ${inMonth?"":"outside"} ${isToday?"today":""}" data-date="${key}" ${inMonth?'':'aria-disabled="true"'}>
        <div class="day-top"><span class="day-number">${d.getDate()}</span>${isToday?'<span class="today-label">Hari ini</span>':""}</div>
        <div class="day-events">${dayContents.slice(0,3).map(c=>eventMarkup(c,true)).join("")}${dayContents.length>3?`<button class="more-events" data-day="${key}">+${dayContents.length-3} lainnya</button>`:""}</div>
      </div>`;
    }
    grid.innerHTML=out;
    $$(".day-cell",grid).forEach(cell=>cell.addEventListener("dblclick",()=>{if(!cell.classList.contains("outside"))openModal(null,cell.dataset.date)}));
    $$("[data-day]",grid).forEach(btn=>btn.addEventListener("click",()=>{activeView="list";updateViewButtons();renderList(btn.dataset.day)}));
    bindEditButtons();
  }
  function renderTimeline(){
    const items=filteredContents().filter(c=>{const d=fromKey(c.date);return d.getFullYear()===currentDate.getFullYear()&&d.getMonth()===currentDate.getMonth()}).sort((a,b)=>a.date.localeCompare(b.date));
    const groups={};items.forEach(c=>(groups[c.date]??=[]).push(c));
    if(!items.length){timeline.innerHTML='<div class="empty-state">Belum ada konten untuk filter dan bulan ini.</div>';return}
    timeline.innerHTML=Object.keys(groups).sort().map(key=>`<div class="timeline-day"><div class="timeline-date"><strong>${fromKey(key).getDate()}</strong>${monthNames[fromKey(key).getMonth()].slice(0,3)} · ${weekdays[fromKey(key).getDay()]}</div><div class="timeline-items">${groups[key].map(c=>`<div class="timeline-item"><i class="status-symbol ${c.status}">${statusSymbols[c.status]}</i><div class="timeline-item-main"><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.brand)} · ${escapeHtml(c.platform)} · PIC ${escapeHtml(c.owner||"—")}</small></div><span class="pill ${c.status}">${statusLabels[c.status]}</span><button class="small-action" data-edit="${c.id}">Edit</button></div>`).join("")}</div></div>`).join("");
    bindEditButtons();
  }
  function renderList(onlyDate=null){
    const items=filteredContents().filter(c=>{const d=fromKey(c.date);return (!onlyDate||c.date===onlyDate)&&d.getFullYear()===currentDate.getFullYear()&&d.getMonth()===currentDate.getMonth()}).sort((a,b)=>a.date.localeCompare(b.date));
    if(!items.length){list.innerHTML='<p class="empty-state">Tidak ada konten yang cocok. Coba ubah filter atau tambahkan konten baru.</p>';return}
    list.innerHTML=`<table class="content-table"><thead><tr><th>Tanggal</th><th>Konten</th><th>Brand / Platform</th><th>PIC</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${items.map(c=>`<tr><td>${niceDate(c.date)}</td><td><span class="table-title">${escapeHtml(c.title)}</span><br><small>${escapeHtml(c.type)}</small></td><td>${escapeHtml(c.brand)}<br><small>${escapeHtml(c.platform)}</small></td><td>${escapeHtml(c.owner||"—")}</td><td><span class="pill ${c.status}">${c.status==="waiting"?"":`<i class="status-symbol ${c.status}">${statusSymbols[c.status]}</i>`}${statusLabels[c.status]}</span></td><td><div class="row-actions"><button class="small-action" data-edit="${c.id}">Edit</button><button class="small-action" data-delete="${c.id}">Hapus</button></div></td></tr>`).join("")}</tbody></table>`;
    bindEditButtons();$$("[data-delete]",list).forEach(btn=>btn.addEventListener("click",()=>deleteContent(Number(btn.dataset.delete))));
  }
  function renderAll(){updateStats();renderCalendar();renderTimeline();renderList();updateViewButtons()}
  function updateViewButtons(){
    $("#calendarViewBtn").classList.toggle("active",activeView==="calendar");
    $("#timelineViewBtn").classList.toggle("active",activeView==="timeline");
    $("#listViewBtn").classList.toggle("active",activeView==="list");
    grid.classList.toggle("hidden",activeView!=="calendar");
    timeline.classList.toggle("hidden",activeView!=="timeline");
    list.classList.toggle("hidden",activeView!=="list");
  }
  function bindEditButtons(){$$("[data-edit]").forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound="1";btn.addEventListener("click",e=>{e.stopPropagation();const c=contents.find(x=>x.id===Number(btn.dataset.edit));if(c)openModal(c)})})}
  function openModal(content=null, presetDate=null){
    form.reset();$("#contentId").value=content?.id??"";
    $("#modalTitle").textContent=content?"Edit Konten":"Tambah Ide Konten";
    $("#saveContent").innerHTML=content?'Simpan Perubahan <span>→</span>':'Simpan Konten <span>→</span>';
    $("#contentTitle").value=content?.title??"";
    $("#contentBrand").value=content?.brand??"CreativeHub";
    $("#contentPlatform").value=content?.platform??"Instagram";
    $("#contentType").value=content?.type??"Reels / Short Video";
    dateInput.value=content?.date??presetDate??dateKey(new Date());
    $("#contentBrief").value=content?.brief??"";
    $("#contentOwner").value=content?.owner??"";
    $("#contentStatus").value=content?.status??"waiting";
    modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
    setTimeout(()=>$("#contentTitle").focus(),100);
  }
  function closeModal(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.style.overflow=""}
  function deleteContent(id){const c=contents.find(x=>x.id===id);if(!c)return;if(!confirm(`Hapus konten "${c.title}"?`))return;contents=contents.filter(x=>x.id!==id);renderAll();showToast("Konten berhasil dihapus.")}
  function setMonth(delta){currentDate=new Date(currentDate.getFullYear(),currentDate.getMonth()+delta,1);renderAll()}
  $("#newContent").addEventListener("click",()=>openModal());
  $("#newContentMobile").addEventListener("click",()=>openModal());
  $("#closeModal").addEventListener("click",closeModal);$("#cancelModal").addEventListener("click",closeModal);
  modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeSidebar()}});
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const id=Number($("#contentId").value);
    const data={title:$("#contentTitle").value.trim(),brand:$("#contentBrand").value,platform:$("#contentPlatform").value,type:$("#contentType").value,date:dateInput.value,status:$("#contentStatus").value,owner:$("#contentOwner").value.trim(),brief:$("#contentBrief").value.trim()};
    if(!data.title||!data.date){showToast("Judul dan tanggal publikasi wajib diisi.");return}
    if(id){contents=contents.map(c=>c.id===id?{...c,...data}:c);showToast("Perubahan konten berhasil disimpan.")}
    else{contents.push({id:nextId++,...data});showToast("Konten baru berhasil ditambahkan.")}
    currentDate=new Date(fromKey(data.date).getFullYear(),fromKey(data.date).getMonth(),1);
    closeModal();renderAll();
  });
  $("#prevMonth").addEventListener("click",()=>setMonth(-1));$("#nextMonth").addEventListener("click",()=>setMonth(1));
  $("#todayBtn").addEventListener("click",()=>{const now=new Date();currentDate=new Date(now.getFullYear(),now.getMonth(),1);renderAll()});
  $("#calendarViewBtn").addEventListener("click",()=>{activeView="calendar";renderAll()});
  $("#timelineViewBtn").addEventListener("click",()=>{activeView="timeline";renderAll()});
  $("#listViewBtn").addEventListener("click",()=>{activeView="list";renderAll()});
  $("#filterButton").addEventListener("click",()=>{
    const options=[["all","Semua status"],["done","✓ Selesai"],["progress","— Dalam proses"],["waiting","○ Menunggu"]];
    const choice=prompt("Filter status:\n1. Semua status\n2. Selesai\n3. Dalam proses\n4. Menunggu",String(({all:1,done:2,progress:3,waiting:4})[filterStatus]));
    if(choice===null)return;const map={"1":"all","2":"done","3":"progress","4":"waiting"};if(!map[choice]){showToast("Pilihan filter tidak valid.");return}filterStatus=map[choice];renderAll();showToast(`Filter: ${options.find(x=>x[0]===filterStatus)[1]}`);
  });
  const sidebar=$("#sidebar"),scrim=$("#sidebarScrim");
  function closeSidebar(){sidebar.classList.remove("open");scrim.classList.remove("show")}
  $("#menuToggle").addEventListener("click",()=>{sidebar.classList.add("open");scrim.classList.add("show")});scrim.addEventListener("click",closeSidebar);
  // Default calendar is October 2026 to match the supplied reference. All data is local demo state.
  renderAll();
})();