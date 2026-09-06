const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'employee', 'Sales.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /console\.error\("Error deleting transaction: ", error\);\s*<span>\$\{item\.productName\} \(x\$\{item\.quantity\}\)<\/span>/s;

const newPart = `console.error("Error deleting transaction: ", error);
         alert("Failed to delete the transaction from Firebase! Check console.");
      }
    }
  };

  const handleGenerateReceipt = async (tx) => {
    
    let itemsListHTML = '';
    if (tx.purchasedItems && tx.purchasedItems.length > 0) {
      itemsListHTML = tx.purchasedItems.map(item => \`
        <div class="flex">
          <span>\${item.productName} (x\${item.quantity})</span>`;

if (regex.test(content)) {
  content = content.replace(regex, newPart);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Fixed Sales.jsx destruction!");
} else {
  console.log("Could not find destroyed part.");
}
