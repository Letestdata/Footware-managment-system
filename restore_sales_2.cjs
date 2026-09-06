const fs = require('fs');
const path = require('path');

const salesCssPath = path.join(__dirname, 'src', 'css', 'Sales.css');

if (fs.existsSync(salesCssPath)) {
  let currentContent = fs.readFileSync(salesCssPath, 'utf8');
  
  const badPart = `.sales-chart-card, .payment-methods-card, .transaction-history {
  background-color: var(--surface);
  align-items: flex-end;
  justify-content: center;
}`;

  if (currentContent.includes(badPart)) {
    const fixedContent = currentContent.replace(
      badPart, 
      `.sales-chart-card, .payment-methods-card, .transaction-history {
  background-color: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--outline);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.chart-filter {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--outline);
  background-color: var(--surface-low);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
}

.chart-placeholder {
  padding: 1.5rem 1.5rem 2.5rem 1.5rem;
  height: 280px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}`
    );
    fs.writeFileSync(salesCssPath, fixedContent, 'utf8');
    console.log("Successfully restored Sales.css");
  } else {
    console.log("Could not find bad part.");
  }
}
