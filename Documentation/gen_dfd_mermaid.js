const https = require('https');
const fs    = require('fs');
const path  = require('path');

const outDir = path.join(__dirname, 'screenshots', 'diagrams');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function mermaidPng(code, filename) {
  return new Promise((resolve, reject) => {
    const enc = Buffer.from(code).toString('base64')
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const url = `https://mermaid.ink/img/${enc}?bgColor=ffffff&type=png`;
    console.log(`⏳  Generating ${filename}...`);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302)
        return mermaidPng(code, filename).then(resolve).catch(reject);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.slice(0,4).toString('hex') !== '89504e47')
          return reject(new Error(buf.toString().substring(0,200)));
        fs.writeFileSync(path.join(outDir, filename), buf);
        console.log(`✅  ${filename}  (${Math.round(buf.length/1024)} KB)`);
        resolve();
      });
    }).on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DFD LEVEL 1
// Layout: EMP + ADM have no predecessors → Dagre places both in leftmost column
//         Processes in middle column, Data Stores in right column
//         ALL edges go LEFT → RIGHT = Dagre uses proper L-shaped routing (no diagonals)
// ─────────────────────────────────────────────────────────────────────────────
const dfd1 = `flowchart LR
    EMP["Employee"]
    ADM["Administrator"]
    P1(["1.0 User\nManagement"])
    P2(["2.0 Leave\nApplication"])
    P3(["3.0 Leave\nApproval"])
    P4(["4.0 Reporting\n& Analytics"])
    P5(["5.0 Config\nManagement"])
    DS1[("D1 | Users Store")]
    DS2[("D2 | Leave Requests")]
    DS3[("D3 | Departments")]
    DS4[("D4 | Leave Types")]

    EMP -->|"Registration Data"| P1
    P1 -->|"Approval Status"| EMP
    EMP -->|"Leave Application"| P2
    P2 -->|"Confirmation"| EMP
    ADM -->|"Approve/Reject User"| P1
    ADM -->|"Approve/Reject Leave"| P3
    ADM -->|"View Reports"| P4
    ADM -->|"Config Commands"| P5
    P1 <-->|"User Data"| DS1
    P2 -->|"New Request"| DS2
    P3 <-->|"Update Status"| DS2
    P4 -->|"Report Data"| DS3
    P5 <-->|"Dept Config"| DS3
    P5 <-->|"Type Config"| DS4

    classDef ext   fill:#ffffff,stroke:#000000,stroke-width:2.5px,color:#000000,font-weight:bold
    classDef proc  fill:#f0f0f0,stroke:#000000,stroke-width:1.5px,color:#000000
    classDef store fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000
    class EMP,ADM ext
    class P1,P2,P3,P4,P5 proc
    class DS1,DS2,DS3,DS4 store`;

// ─────────────────────────────────────────────────────────────────────────────
// DFD LEVEL 2  (decomposition of Process 2.0 — Leave Application)
// Sequential flow: EMP → P2.1 → P2.2 → P2.3 → P2.4 → P2.5
// All forward edges → L-shaped routing, no diagonals
// ─────────────────────────────────────────────────────────────────────────────
const dfd2 = `flowchart LR
    EMP["Employee"]
    P21(["2.1
Validate
Dates"])
    P22(["2.2
Count
Working Days"])
    P23(["2.3
Check
Leave Balance"])
    P24(["2.4
Assign
Priority"])
    P25(["2.5
Create
Request"])
    DS1[("D1 | Users Store")]
    DS4[("D4 | Leave Types")]
    DS2[("D2 | Leave Requests")]
    ERR["Error Response
HTTP 400"]
    OK["Success Response
HTTP 201"]

    EMP -->|"Application Data"| P21
    P21 -->|"Valid Dates"| P22
    P22 -->|"Working Day Count"| P23
    P23 -->|"Balance OK"| P24
    P24 -->|"Priority Level"| P25
    P23 <-->|"Read Balance"| DS1
    P24 <-->|"Get Leave Type"| DS4
    P25 -->|"Write Request"| DS2
    P21 -->|"Invalid Dates"| ERR
    P23 -->|"Insufficient Balance"| ERR
    ERR -->|"Error Response"| EMP
    P25 -->|"Created"| OK
    OK  -->|"Confirmation"| EMP

    classDef ext   fill:#ffffff,stroke:#000000,stroke-width:2.5px,color:#000000,font-weight:bold
    classDef proc  fill:#f0f0f0,stroke:#000000,stroke-width:1.5px,color:#000000
    classDef store fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000
    classDef resp  fill:#f8f8f8,stroke:#555555,stroke-width:1px,color:#000000
    class EMP ext
    class P21,P22,P23,P24,P25 proc
    class DS1,DS4,DS2 store
    class ERR,OK resp`;

(async () => {
  await mermaidPng(dfd1, 'dfd_level1.png');
  await mermaidPng(dfd2, 'dfd_level2.png');
  console.log('\nDone — check screenshots/diagrams/');
})();
