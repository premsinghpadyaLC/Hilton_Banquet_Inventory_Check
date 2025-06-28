const items = [
  "Dinner Forks",
  "Small Forks", 
  "Dinner Knives",
  "Small Knives",
  "Soup Spoons",
  "Teaspoons",
  "Serving Spoons",
  "Tongs",
  "Serving Trays",
  "Pitchers",
  "Chafing Dishes",
  "Glassware"
];

let cur = new Date();

window.onload = () => {
  populateMonthSelect();
  loadMonth();
};

function populateMonthSelect() {
  const sel = document.getElementById("monthSelect");
  const dt = new Date();
  for (let y = dt.getFullYear() - 1; y <= dt.getFullYear() + 1; y++) {
    for (let m = 0; m < 12; m++) {
      const opt = new Option(`${m + 1}/${y}`, `${y}-${m}`);
      sel.add(opt);
    }
  }
}

function keyFor(d) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function prevMonth() {
  cur.setMonth(cur.getMonth() - 1);
  loadMonth();
}

function nextMonth() {
  cur.setMonth(cur.getMonth() + 1);
  loadMonth();
}

function loadMonth() {
  const key = keyFor(cur);
  document.getElementById("monthSelect").value = key;
  const saved = JSON.parse(localStorage.getItem(key)) || {};

  document.getElementById("managerName").value = "Mr. Lokesh Swami";
  document.getElementById("reportedBy").value = saved.reportedBy || "";
  document.getElementById("signature").value = saved.signature || "";
  document.getElementById("datetime").innerText = cur.toLocaleDateString();

  const tbody = document.getElementById("inventoryTable");
  tbody.innerHTML = "";

  items.forEach((it, i) => {
    const row = document.createElement("tr");
    const dat = saved.inventory?.[i] || {};
    row.innerHTML = `
      <td>${it}</td>
      <td><input type="number" id="q-${i}" value="${dat.qty || 0}" /></td>
      <td><input type="text" id="n-${i}" value="${dat.notes || ""}" /></td>
    `;
    tbody.appendChild(row);
  });
}

function nameOf(id) {
  return document.getElementById(id).value.trim();
}

function saveCurrent() {
  const key = keyFor(cur);
  const data = {
    manager: "Mr. Lokesh Swami",
    reportedBy: nameOf("reportedBy"),
    signature: nameOf("signature"),
    inventory: []
  };

  items.forEach((_, i) => {
    data.inventory[i] = {
      qty: document.getElementById(`q-${i}`).value,
      notes: document.getElementById(`n-${i}`).value
    };
  });

  localStorage.setItem(key, JSON.stringify(data));
  alert("Saved for " + key);
}

async function generatePDFAll() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  const months = Array.from(document.getElementById("monthSelect").options)
    .filter((o) => localStorage.getItem(o.value))
    .sort((a, b) => (a.value > b.value ? 1 : -1));

  for (let idx = 0; idx < months.length; idx++) {
    const opt = months[idx];
    const d = JSON.parse(localStorage.getItem(opt.value));

    // Header
    doc.setFontSize(16).setFont("helvetica", "bold");
    doc.text("Hilton Garden Inn Ottawa Airport", 40, 40);
    doc.setFontSize(12).setFont("helvetica", "normal");
    doc.text("Banquet Inventory Monthly Report", 40, 60);
    doc.text(`Month: ${opt.text}`, 40, 80);
    doc.text(`Manager: ${d.manager || "-"}`, 300, 80);
    doc.text(`Reported By: ${d.reportedBy || "-"}`, 40, 100);
    doc.text(`Signature: ${d.signature || "-"}`, 300, 100);

    // Table
    const tableBody = items.map((item, i) => {
      const inv = d.inventory[i] || {};
      return [item, inv.qty || "0", inv.notes || "-"];
    });

    doc.autoTable({
      startY: 120,
      head: [["Item", "Quantity", "Notes"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11
      },
      styles: {
        fontSize: 10,
        cellPadding: 6
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 120, bottom: 100 }
    });

    // Signature line
    const endY = doc.lastAutoTable.finalY + 40;
    doc.setFontSize(11);
    doc.text("____________________________", 40, endY);
    doc.text("Banquet Manager Signature", 40, endY + 15);

    doc.text("____________________________", 300, endY);
    doc.text("Date & Confirmation", 300, endY + 15);

    // Footer with page number
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(9).setTextColor(150);
    for (let n = 1; n <= pageCount; n++) {
      doc.setPage(n);
      doc.text(
        `Page ${n} of ${pageCount}`,
        doc.internal.pageSize.width - 80,
        doc.internal.pageSize.height - 20
      );
    }

    if (idx < months.length - 1) doc.addPage();
  }

  doc.save(`Banquet_Inventory_Report_${Date.now()}.pdf`);
}
