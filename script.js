const STORAGE_KEY = "fx_trades";
const tradeForm = document.getElementById("tradeForm");
const tbody = document.querySelector("#tradeTable tbody");

// Load trades from localStorage on page load
window.addEventListener("DOMContentLoaded", () => {
  const trades = getTradesFromStorage();
  trades.forEach(addTradeRow);
  renderTradeChart();
});

// Add new trade
tradeForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const trade = {
    id: Date.now(),
    currencyPair: document.getElementById("currencyPair").value.trim(),
    dateTime: document.getElementById("dateTime").value,
    reason: document.getElementById("reason").value.trim(),
    emotion: document.getElementById("emotion").value,
    lotSize: document.getElementById("lotSize").value,
    result: "Pending"
  };

  saveTradeToStorage(trade);
  addTradeRow(trade);
  renderTradeChart();
  this.reset();
});

// Add row to table
function addTradeRow(trade) {
  const row = tbody.insertRow();
  row.setAttribute("data-id", trade.id);
  row.classList.add("fade-row");

  row.innerHTML = `
    <td>${trade.currencyPair}</td>
    <td>${new Date(trade.dateTime).toLocaleString()}</td>
    <td>${trade.reason}</td>
    <td>${trade.emotion}</td>
    <td>${trade.lotSize}</td>
    <td class="result">${trade.result}</td>
    <td class="actions"></td>
  `;

  const resultCell = row.querySelector(".result");
  const actionsCell = row.querySelector(".actions");

  const resultBtn = document.createElement("button");
  resultBtn.textContent = trade.result === "Pending" ? "Add Result" : "Completed";
  resultBtn.disabled = trade.result !== "Pending";

  resultBtn.addEventListener("click", () => {
    const input = prompt("Enter result: profit, loss, or breakeven")?.toLowerCase().trim();
    const mapResult = { profit: "✅ Profit", loss: "❌ Loss", breakeven: "⚖️ Breakeven" };

    if (input && mapResult[input]) {
      resultCell.textContent = mapResult[input];
      resultBtn.textContent = "Completed";
      resultBtn.disabled = true;
      updateResultInStorage(trade.id, mapResult[input]);
      renderTradeChart();
    } else if (input !== null) {
      alert("Invalid input. Please type profit, loss, or breakeven.");
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => {
    if (confirm("Delete this trade?")) {
      row.remove();
      deleteTradeFromStorage(trade.id);
      renderTradeChart();
    }
  });

  actionsCell.appendChild(resultBtn);
  actionsCell.appendChild(deleteBtn);
}

// LocalStorage functions
function getTradesFromStorage() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}
function saveTradeToStorage(trade) {
  const trades = getTradesFromStorage();
  trades.push(trade);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}
function updateResultInStorage(id, result) {
  const trades = getTradesFromStorage().map(t => t.id === id ? { ...t, result } : t);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}
function deleteTradeFromStorage(id) {
  const trades = getTradesFromStorage().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

// Download PDF
document.getElementById("downloadPDF").addEventListener("click", () => {
  const element = document.getElementById("pdfContent");

  html2pdf().set({
    margin: 0.2,
    filename: `fx_trades_${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
  }).from(element).save();
});

// Chart.js line chart
function renderTradeChart() {
  const trades = getTradesFromStorage();
  const summary = { Profit: 0, Loss: 0, Breakeven: 0 };

  trades.forEach(t => {
    if (t.result.includes("Profit")) summary.Profit++;
    else if (t.result.includes("Loss")) summary.Loss++;
    else if (t.result.includes("Breakeven")) summary.Breakeven++;
  });

  const ctx = document.getElementById("tradeChart")?.getContext("2d");
  if (!ctx) return;

  if (window.tradeChartInstance) window.tradeChartInstance.destroy();

  window.tradeChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Profit", "Loss", "Breakeven"],
      datasets: [{
        label: "Trade Results",
        data: [summary.Profit, summary.Loss, summary.Breakeven],
        fill: false,
        tension: 0.3,
        pointRadius: 6,
        pointBackgroundColor: ["#4caf50", "#f44336", "#ffc107"],
        borderColor: "#4f7942",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}
