const fs = require('fs');
let txt = fs.readFileSync('C:\\Users\\offic\\.gemini\\antigravity\\brain\\58776ddb-0281-46b2-b6eb-daaf3c564b44\\.system_generated\\steps\\227\\output.txt', 'utf8');
txt = txt.substring(txt.indexOf('{'));
let w = JSON.parse(txt);
for (let n of w.nodes) {
  if (n.name === 'Parse SES Payload') {
    n.parameters.jsCode = n.parameters.jsCode.replace(
      "return [{\n    json: {\n      ok: true,\n      skipped: true,\n      notificationType,\n      reason: 'No matching recipients or unsupported notification type'\n    }\n  }];",
      "return []; // Stoppt weitere Ausführung, statt leere Objekte weiterzugeben!"
    );
  }
}
fs.writeFileSync('C:\\Users\\offic\\Desktop\\w_fixed.json', JSON.stringify({nodes: w.nodes, connections: w.connections, name: w.name, active: w.active}, null, 2));
