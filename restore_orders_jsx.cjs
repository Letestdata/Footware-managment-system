const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'employee', 'Orders.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /\{groupedReceipts\.length === 0 && \(\s*<div className="modal-overlay">/;

const goodPart = `{groupedReceipts.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No receipts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            );
          })()}

        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">`;

if (regex.test(content)) {
  content = content.replace(regex, goodPart);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Restored Orders.jsx!");
} else {
  console.log("Could not find the bad part in Orders.jsx.");
}
