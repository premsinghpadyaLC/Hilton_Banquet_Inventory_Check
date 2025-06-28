const items = ["Dinner Forks","Small Forks","Dinner Knives","Small Knives","Soup Spoons","Teaspoons","Serving Spoons","Tongs","Serving Trays","Pitchers","Chafing Dishes","Glassware"];
let cur = new Date(), today = new Date();

window.onload = () => {
  populateMonthSelect();
  loadMonth();
};

function populateMonthSelect() {
  const sel = document.getElementById("monthSelect"), dt = new Date();
  for(let y=dt.getFullYear()-1; y<=dt.getFullYear()+1; y++){
    for(let m=0; m<12; m++){
      const opt = new Option(`${m+1}/${y}`, `${y}-${m}`);
      sel.add(opt);
    }
  }
}

function prevMonth(){ cur.setMonth(cur.getMonth()-1); loadMonth(); }
function nextMonth(){ cur.setMonth(cur.getMonth()+1); loadMonth(); }

function loadMonth(){
  const key = keyFor(cur);
  document.getElementById("monthSelect").value = key;
  const saved = JSON.parse(localStorage.getItem(key))||{};
  document.getElementById("managerName").value = saved.manager||"";
  document.getElementById("reportedBy").value = saved.reportedBy||"";
  document.getElementById("signature").value = saved.signature||"";
  document.getElementById("datetime").innerText = cur.toLocaleDateString();

  const tbody = document.getElementById("inventoryTable");
  tbody.innerHTML = "";
  items.forEach((it, i)=>{
    const row = document.createElement("tr");
    const dat = saved.inventory?.[i]||{};
    row.innerHTML = `<td>${it}</td>
      <td><input type="number" id="q-${i}" value="${dat.qty||0}"></td>
      <td><input type="text" id="n-${i}" value="${dat.notes||''}"></td>
      <td><input type="file" accept="image/*" onchange="loadImg(event,${i})"><br>
          <img id="img-${i}" src="${dat.photo||''}" style="max-width:60px;"></td>`;
    tbody.appendChild(row);
  });
}

function keyFor(d){ return `${d.getFullYear()}-${d.getMonth()}`; }

function loadImg(e,i){
  const f=e.target.files[0], r=new FileReader();
  r.onload=()=> document.getElementById(`img-${i}`).src = r.result;
  r.readAsDataURL(f);
}

function saveCurrent(){
  const key=keyFor(cur);
  const data={manager:nameOf("managerName"),reportedBy:nameOf("reportedBy"),signature:nameOf("signature"),inventory:[]};
  items.forEach((_,i)=> data.inventory[i]={
    qty:document.getElementById(`q-${i}`).value,
    notes:document.getElementById(`n-${i}`).value,
    photo:document.getElementById(`img-${i}`).src
  });
  localStorage.setItem(key,JSON.stringify(data));
  alert("Saved for "+key);
}

function nameOf(id){return document.getElementById(id).value.trim();}

async function generatePDFAll(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;
  Array.from(document.getElementById("monthSelect").options)
    .filter(o=> localStorage.getItem(o.value) )
    .sort((a,b)=>a.value>b.value?1:-1)
    .forEach(opt=>{
      const d=JSON.parse(localStorage.getItem(opt.value));
      doc.text(`Month: ${opt.text}`,10,y); y+=6;
      doc.text(`Manager: ${d.manager}`,10,y); doc.text(`By: ${d.reportedBy}`,80,y);
      doc.text(`Sig: ${d.signature}`,150,y); y+=6;
      items.forEach((it,i)=>{
        const inv=d.inventory[i]||{};
        doc.text(`${it}`,10,y); doc.text(`${inv.qty}`,80,y);
        doc.text(`${inv.notes||'-'}`,100,y);
        if(inv.photo){
          doc.addImage(inv.photo,'JPEG',150,y-4,30,30);
        }
        y+=12;
        if(y>260){ doc.addPage(); y=10; }
      });
      doc.addPage(); y=10;
    });
  doc.save(`Banquet_MultiMonth_${Date.now()}.pdf`);
}
