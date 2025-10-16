// Data for categories
const data = {
  groceries: 200,
  rent: 1200,
  entertainment: 100,
  travel: 150
};

document.addEventListener('DOMContentLoaded', () => {
  const showSummaryBtn = document.getElementById('showSummaryBtn');
  const categoryForm = document.getElementById('categoryForm');
  const displayArea = document.getElementById('displayArea');
  const summaryOutput = document.getElementById('summaryOutput');

  // Handle category page logic
  if (showSummaryBtn && categoryForm) {
    showSummaryBtn.addEventListener('click', () => {
      const selected = Array.from(categoryForm.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
      if (selected.length === 0) {
        displayArea.innerHTML = "<p>No categories selected.</p>";
        return;
      }
      const selectedData = selected.map(c => `<p>${c.toUpperCase()}: $${data[c]}</p>`).join('');
      localStorage.setItem('summary', JSON.stringify(selected));
      displayArea.innerHTML = `${selectedData}<p><a href='summary.html'>View Summary</a></p>`;
    });
  }

  // Handle summary page logic
  if (summaryOutput) {
    const selectedCategories = JSON.parse(localStorage.getItem('summary') || '[]');
    if (selectedCategories.length > 0) {
      let total = 0;
      const summaryHTML = selectedCategories.map(c => {
        total += data[c];
        return `<p>${c.toUpperCase()}: $${data[c]}</p>`;
      }).join('');
      summaryOutput.innerHTML = `${summaryHTML}<h3>Total: $${total}</h3>`;
    } else {
      summaryOutput.innerHTML = "<p>No data found. Go back to select categories.</p>";
    }
  }
});
