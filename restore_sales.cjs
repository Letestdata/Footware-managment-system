const fs = require('fs');
const path = require('path');

const salesCssPath = path.join(__dirname, 'src', 'css', 'Sales.css');

const originalSalesCss = `.sales-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sales-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.sales-chart-card, .payment-methods-card, .transaction-history {
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
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  gap: 20px;
}

.bar {
  background-color: var(--primary);
  width: 30px;
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: height 0.3s;
}

.bar span {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}
`;

if (fs.existsSync(salesCssPath)) {
  let currentContent = fs.readFileSync(salesCssPath, 'utf8');
  
  // We need to replace the destroyed top section. We will just restore the top part of the file
  const regex = /\.sales-chart-card, \.payment-methods-card, \.transaction-history \{\s*background-color: var\(--surface\);\s*align-items: flex-end;\s*justify-content: center;\s*\}/;
  
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
    console.log("Restored Sales.css and added color: var(--text-main) to .chart-filter");
  } else {
    console.log("Could not find the destroyed part.");
  }
}
