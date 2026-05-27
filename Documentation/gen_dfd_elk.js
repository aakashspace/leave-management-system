/**
 * gen_dfd_elk.js
 * Generates DFD Level 1 and Level 2 using Mermaid ELK renderer
 * ELK = Eclipse Layout Kernel — true orthogonal (right-angle) routing
 */
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
    console.log(`⏳  ${filename}...`);
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400)
        return mermaidPng(code, filename).then(resolve).catch(reject);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.slice(0,4).toString('hex') !== '89504e47') {
          console.log('  Not PNG:', buf.toString().substring(0,200));
          return reject(new Error('Not PNG'));
        }
        const p = path.join(outDir, filename);
        fs.writeFileSync(p, buf);
        console.log(`✅  ${filename}  (${Math.round(buf.length/1024)} KB)`);
        resolve(p);
      });
    }).on('error', reject);
  });
}

// ─── DFD Level 1 with ELK renderer ──────────────────────────────────────────
const dfd1 = `%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
flowchart LR
    EMP["Employee"]
    ADM["Administrator"]
    P1(["1.0 User Management"])
    P2(["2.0 Leave Application"])
    P3(["3.0 Leave Approval"])
    P4(["4.0 Reporting and Analytics"])
    P5(["5.0 Config Management"])
    DS1[("D1 | Users Store")]
    DS2[("D2 | Leave Requests")]
    DS3[("D3 | Departments")]
    DS4[("D4 | Leave Types")]

    EMP -->|"Registration Data"| P1
    P1  -->|"Approval Status"| EMP
    EMP -->|"Leave Application"| P2
    P2  -->|"Confirmation"| EMP
    ADM -->|"Approve / Reject User"| P1
    ADM -->|"Approve / Reject Leave"| P3
    ADM -->|"View Reports"| P4
    ADM -->|"Config Commands"| P5
    P1  <-->|"User Data"| DS1
    P2  -->|"New Request"| DS2
    P3  <-->|"Update Status"| DS2
    P4  -->|"Report Data"| DS3
    P5  <-->|"Dept Config"| DS3
    P5  <-->|"Type Config"| DS4

    classDef ext   fill:#ffffff,stroke:#000000,stroke-width:2.5px,color:#000000,font-weight:bold
    classDef proc  fill:#f0f0f0,stroke:#000000,stroke-width:1.5px,color:#000000
    classDef store fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000
    class EMP,ADM ext
    class P1,P2,P3,P4,P5 proc
    class DS1,DS2,DS3,DS4 store`;

// ─── DFD Level 2 — TB layout, EMP appears top + bottom to avoid cycles ───────
// DS1/DS4 feed INTO processes (one-way) so ELK keeps clean sequential flow.
// All edges top-to-bottom = pure L-shaped routing, compact, fits in document.
const dfd2 = `%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
flowchart TB
    EMP_IN["Employee"]
    DS1[("D1 | Users Store")]
    DS4[("D4 | Leave Types")]
    P21(["2.1 Validate Dates"])
    P22(["2.2 Count Working Days"])
    P23(["2.3 Check Leave Balance"])
    P24(["2.4 Assign Priority"])
    P25(["2.5 Create Request"])
    DS2[("D2 | Leave Requests")]
    ERR["Error Response - HTTP 400"]
    OK["Success - HTTP 201"]
    EMP_OUT["Employee"]

    EMP_IN -->|"Application Data"| P21
    DS1    -->|"Balance Data"| P23
    DS4    -->|"Leave Type Info"| P24
    P21    -->|"Valid Dates"| P22
    P22    -->|"Working Day Count"| P23
    P23    -->|"Balance OK"| P24
    P24    -->|"Priority Level"| P25
    P25    -->|"Write Request"| DS2
    P21    -->|"Invalid Dates"| ERR
    P23    -->|"Insufficient Balance"| ERR
    P25    -->|"Created"| OK
    ERR    -->|"Error Response"| EMP_OUT
    OK     -->|"Confirmation"| EMP_OUT

    classDef ext   fill:#ffffff,stroke:#000000,stroke-width:2.5px,color:#000000,font-weight:bold
    classDef proc  fill:#f0f0f0,stroke:#000000,stroke-width:1.5px,color:#000000
    classDef store fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000
    classDef resp  fill:#f8f8f8,stroke:#555555,stroke-dasharray:4,color:#000000
    class EMP_IN,EMP_OUT ext
    class P21,P22,P23,P24,P25 proc
    class DS1,DS4,DS2 store
    class ERR,OK resp`;

(async () => {
  try {
    await mermaidPng(dfd1, 'dfd_level1.png');
    await mermaidPng(dfd2, 'dfd_level2.png');
    console.log('\nDone → screenshots/diagrams/');
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
