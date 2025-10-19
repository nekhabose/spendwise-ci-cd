
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('saveBtn');
  const displayArea = document.getElementById('displayArea');
  const summaryOutput = document.getElementById('summaryOutput');
  const backBtn = document.getElementById('backBtn');
  const clearDataBtn = document.getElementById('clearData');

 
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const categories = ['groceries', 'rent', 'entertainment', 'travel'];
      const spendingData = {};
      let valid = false;

      categories.forEach(cat => {
        const input = document.getElementById(cat);
        const value = parseFloat(input.value);

        if (!isNaN(value) && value > 0) {
          spendingData[cat] = value;
          valid = true;
        }
      });

      // Validation check
      if (!valid) {
        displayArea.innerHTML = "<p style='color: red;'>⚠️ Please enter at least one spending amount.</p>";
        return;
      }

      // Save to localStorage
      localStorage.setItem('spendingData', JSON.stringify(spendingData));

      // Success message
      displayArea.innerHTML = `
        <p style="color: green;">✅ Spending data saved successfully!</p>
        <p><a href="summary.html" style="color:#2f6b1f; font-weight:bold;">View Summary →</a></p>
      `;
    });
  }

  
  if (summaryOutput) {
    const spendingData = JSON.parse(localStorage.getItem('spendingData') || '{}');

    if (Object.keys(spendingData).length === 0) {
      summaryOutput.innerHTML = "<p>No data found. Go back to enter your spending.</p>";
      return;
    }

    let total = 0;
    const labels = [];
    const values = [];

    Object.entries(spendingData).forEach(([category, amount]) => {
      total += amount;
      labels.push(category.charAt(0).toUpperCase() + category.slice(1));
      values.push(amount);
    });

    // Display summary
    summaryOutput.innerHTML = `
      ${labels
        .map((cat, i) => `<p><span>${cat}</span><span>$${values[i].toFixed(2)}</span></p>`)
        .join('')}
      <h3>Total Spending: $${total.toFixed(2)}</h3>
    `;

    const canvas = document.getElementById('spendingChart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const colors = ['#56ab2f', '#8bc34a', '#aed581', '#c5e1a5'];

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const maxVal = Math.max(...values);
      const scale = (canvas.height - 40) / maxVal;

      values.forEach((value, i) => {
        const barWidth = 50;
        const barHeight = value * scale;
        const x = i * (barWidth + 40) + 40;
        const y = canvas.height - barHeight - 20;

        // Draw bar
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(x, y, barWidth, barHeight);

        // Label below bar
        ctx.fillStyle = "#333";
        ctx.font = "14px Poppins";
        ctx.fillText(labels[i], x, canvas.height - 5);

        // Value above bar
        ctx.fillStyle = "#2f6b1f";
        ctx.font = "bold 12px Poppins";
        ctx.fillText(`$${value.toFixed(0)}`, x, y - 5);
      });
    }
  }

 
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      location.href = 'categories.html';
    });
  }

  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      const confirmClear = confirm("Are you sure you want to clear all spending data?");
      if (confirmClear) {
        localStorage.removeItem('spendingData');
        alert("All spending data has been cleared.");
        location.reload();
      }
    });
  }
});
