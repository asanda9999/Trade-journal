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
    <td><span class="result">${trade.result}</span></td>
    <td class="actions action-column"></td>
  `;

  const resultSpan = row.querySelector(".result");
  const actionsCell = row.querySelector(".actions");

  // Add visual styling based on result
  updateResultStyling(resultSpan, trade.result);

  const resultBtn = document.createElement("button");
  resultBtn.textContent = trade.result === "Pending" ? "Add Result" : "Completed";
  resultBtn.disabled = trade.result !== "Pending";
  
  // Add loading state on click
  resultBtn.addEventListener("click", () => {
    resultBtn.classList.add("loading");
    resultBtn.textContent = "Processing...";
    
    setTimeout(() => {
      const input = prompt("Enter result: profit, loss, or breakeven")?.toLowerCase().trim();
      const mapResult = { profit: "✅ Profit", loss: "❌ Loss", breakeven: "⚖️ Breakeven" };

      if (input && mapResult[input]) {
        resultSpan.textContent = mapResult[input];
        updateResultStyling(resultSpan, mapResult[input]);
        resultBtn.textContent = "Completed";
        resultBtn.disabled = true;
        updateResultInStorage(trade.id, mapResult[input]);
        renderTradeChart();
        
        // Add success animation
        row.style.animation = "none";
        row.offsetHeight; // Trigger reflow
        row.style.animation = "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
      } else if (input !== null) {
        alert("Invalid input. Please type profit, loss, or breakeven.");
      }
      
      resultBtn.classList.remove("loading");
      if (trade.result === "Pending") {
        resultBtn.textContent = "Add Result";
      }
    }, 500);
  });
  // Create dropdown for result selection
  if (trade.result === "Pending") {
    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "result-dropdown";
    
    const dropdown = document.createElement("select");
    dropdown.innerHTML = `
      <option value="" disabled selected>Select Result</option>
      <option value="profit">✅ Profit</option>
      <option value="loss">❌ Loss</option>
      <option value="breakeven">⚖️ Breakeven</option>
    `;
    
    dropdown.addEventListener("change", (e) => {
      const selectedValue = e.target.value;
      const mapResult = { 
        profit: "✅ Profit", 
        loss: "❌ Loss", 
        breakeven: "⚖️ Breakeven" 
      };
      
      if (mapResult[selectedValue]) {
        // Add smooth transition effect
        resultSpan.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        resultSpan.style.transform = "scale(0.95)";
        
        setTimeout(() => {
          resultSpan.textContent = mapResult[selectedValue];
          updateResultStyling(resultSpan, mapResult[selectedValue]);
          resultSpan.style.transform = "scale(1)";
          
          // Mark dropdown as completed
          dropdownContainer.classList.add("completed");
          dropdown.disabled = true;
          
          updateResultInStorage(trade.id, mapResult[selectedValue]);
          renderTradeChart();
          
          // Add success animation to the row
          row.style.animation = "none";
          row.offsetHeight; // Trigger reflow
          row.style.animation = "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        }, 150);
      }
    });
    
    dropdownContainer.appendChild(dropdown);
    actionsCell.appendChild(dropdownContainer);
  } else {
    // For completed trades, show a disabled dropdown with the current result
    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "result-dropdown completed";
    
    const dropdown = document.createElement("select");
    dropdown.disabled = true;
    
    const resultValue = trade.result.includes("Profit") ? "profit" : 
                       trade.result.includes("Loss") ? "loss" : "breakeven";
    
    dropdown.innerHTML = `
      <option value="${resultValue}" selected>${trade.result}</option>
    `;
    
    dropdownContainer.appendChild(dropdown);
    actionsCell.appendChild(dropdownContainer);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => {
    if (confirm("Delete this trade?")) {
      // Add fade out animation before removing
      row.style.animation = "fadeOut 0.3s ease-out forwards";
      setTimeout(() => {
        row.remove();
        deleteTradeFromStorage(trade.id);
        renderTradeChart();
      }, 300);
    }
  });

  actionsCell.appendChild(deleteBtn);
}

// Add result styling function
function updateResultStyling(element, result) {
  // Remove existing classes
  element.className = "result";
  
  if (result.includes("Profit")) {
    element.style.background = "linear-gradient(135deg, #48bb78, #38a169)";
    element.style.color = "white";
  } else if (result.includes("Loss")) {
    element.style.background = "linear-gradient(135deg, #f56565, #e53e3e)";
    element.style.color = "white";
  } else if (result.includes("Breakeven")) {
    element.style.background = "linear-gradient(135deg, #ed8936, #dd6b20)";
    element.style.color = "white";
  } else {
    element.style.background = "linear-gradient(135deg, #e2e8f0, #cbd5e0)";
    element.style.color = "#4a5568";
  }
}

// Add CSS for fade out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-20px);
    }
  }
`;
document.head.appendChild(style);

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
  const button = document.getElementById("downloadPDF");
  const originalText = button.textContent;
  
  button.textContent = "📄 Generating PDF...";
  button.disabled = true;
  
  // Add metadata to container for PDF
  const container = document.getElementById("pdfContent");
  const trades = getTradesFromStorage();
  container.setAttribute('data-date', new Date().toLocaleDateString());
  container.setAttribute('data-total-trades', trades.length);
  
  const element = document.getElementById("pdfContent");

  html2pdf().set({
    margin: [0.75, 0.5, 0.75, 0.5],
    filename: `fx_trades_${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
  }).from(element).save().then(() => {
    button.textContent = originalText;
    button.disabled = false;
  });
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
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: ["#48bb78", "#f56565", "#ed8936"],
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        borderColor: "#4299e1",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(45, 55, 72, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#4299e1',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: { 
        y: { 
          beginAtZero: true, 
          ticks: { 
            stepSize: 1,
            color: '#718096'
          },
          grid: {
            color: 'rgba(113, 128, 150, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#718096'
          },
          grid: {
            color: 'rgba(113, 128, 150, 0.1)'
          }
        }
      }
    }
  });
}
