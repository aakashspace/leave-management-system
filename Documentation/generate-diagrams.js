/**
 * generate-diagrams.js
 * Generates ER Diagram, DFD (L0, L1, L2), and Use Case Diagram
 * using the mermaid.ink online rendering API → saves as PNG files.
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const outDir = path.join(__dirname, 'screenshots', 'diagrams');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─── Helper: fetch a URL following one redirect ──────────────────────────────
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// ─── Helper: encode mermaid code → mermaid.ink URL ───────────────────────────
function mermaidUrl(code) {
  const encoded = Buffer.from(code).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://mermaid.ink/img/${encoded}?bgColor=ffffff&type=png`;
}

// ─── Generate one diagram ─────────────────────────────────────────────────────
async function generate(filename, code) {
  console.log(`⏳  Generating ${filename}...`);
  const url = mermaidUrl(code);
  const buf = await fetchUrl(url);
  if (buf.length < 500 || buf.slice(0, 4).toString('hex') !== '89504e47') {
    const preview = buf.slice(0, 300).toString();
    throw new Error(`${filename}: not a valid PNG (${buf.length} bytes). Response: ${preview}`);
  }
  const out = path.join(outDir, filename);
  fs.writeFileSync(out, buf);
  console.log(`✅  ${filename}  (${Math.round(buf.length / 1024)} KB)`);
}

// ════════════════════════════════════════════════════════════════════════════
// DIAGRAM DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

// ── 1. ER DIAGRAM ────────────────────────────────────────────────────────────
const erDiagram = `erDiagram
    DEPARTMENT {
        string id PK
        string dept_name
    }
    USER {
        string id PK
        string name
        string email
        string role
        string status
        string dept_id FK
    }
    LEAVETYPE {
        string id PK
        string name
        int max_days
        string color_code
        boolean is_paid
    }
    LEAVEREQUEST {
        string id PK
        string user_id FK
        string type_id FK
        string leave_type_name
        date start_date
        date end_date
        int total_days
        boolean is_paid
        string reason
        string status
        string priority
        string admin_comment
    }
    LEAVEBALANCE {
        string id PK
        string user_id FK
        string leave_type_id FK
        string leave_type_name
        int total_days
        int used_days
        int remaining_days
    }

    DEPARTMENT ||--o{ USER : has
    USER ||--o{ LEAVEREQUEST : submits
    USER ||--o{ LEAVEBALANCE : has
    LEAVETYPE ||--o{ LEAVEREQUEST : categorises
    LEAVETYPE ||--o{ LEAVEBALANCE : tracked`;

// ── 2. DFD LEVEL 0 — Context Diagram ────────────────────────────────────────
const dfd0 = `flowchart LR
    EMP["EMPLOYEE"]
    ADM["ADMINISTRATOR"]
    SYS(["LEAVE MANAGEMENT SYSTEM"])
    DB[("MongoDB Database")]

    EMP -->|"Registration / Leave Applications"| SYS
    SYS -->|"Leave Status / Balance Info"| EMP
    ADM -->|"Approvals / Configuration"| SYS
    SYS -->|"Reports / User Management"| ADM
    SYS <-->|"Read / Write"| DB

    style EMP fill:#BBDEFB,stroke:#1565C0,stroke-width:2px
    style ADM fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px
    style SYS fill:#E8EAF6,stroke:#3949AB,stroke-width:3px
    style DB  fill:#FFF8E1,stroke:#E65100,stroke-width:2px`;

// ── 3. DFD LEVEL 1 ───────────────────────────────────────────────────────────
const dfd1 = `flowchart TD
    EMP["EMPLOYEE"]
    ADM["ADMINISTRATOR"]

    P1(["P1: User Management"])
    P2(["P2: Leave Application"])
    P3(["P3: Leave Approval"])
    P4(["P4: Reporting"])

    DS1[("D1: Users Store")]
    DS2[("D2: Leave Requests")]
    DS3[("D3: Departments")]
    DS4[("D4: Leave Types")]

    EMP -->|"Register / Update Profile"| P1
    ADM -->|"Approve / Reject User"| P1
    P1 <-->|"Read / Write"| DS1

    EMP -->|"Submit Leave Application"| P2
    P2 <-->|"Check Balance"| DS1
    P2 <-->|"Get Leave Types"| DS4
    P2 -->|"Create Request"| DS2

    ADM -->|"Approve / Reject Leave"| P3
    P3 <-->|"Update Request Status"| DS2
    P3 -->|"Deduct Leave Balance"| DS1

    ADM -->|"Request Reports"| P4
    P4 <-->|"Aggregate Leave Data"| DS2
    P4 <-->|"Join User Data"| DS1
    P4 <-->|"Join Dept Data"| DS3

    style EMP fill:#BBDEFB,stroke:#1565C0,stroke-width:2px
    style ADM fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px
    style P1 fill:#E8EAF6,stroke:#3949AB
    style P2 fill:#E8EAF6,stroke:#3949AB
    style P3 fill:#E8EAF6,stroke:#3949AB
    style P4 fill:#E8EAF6,stroke:#3949AB
    style DS1 fill:#FFF8E1,stroke:#E65100
    style DS2 fill:#FFF8E1,stroke:#E65100
    style DS3 fill:#FFF8E1,stroke:#E65100
    style DS4 fill:#FFF8E1,stroke:#E65100`;

// ── 4. DFD LEVEL 2 — Leave Application Process (P2) ─────────────────────────
const dfd2 = `flowchart TD
    EMP["EMPLOYEE"]

    P21(["P2.1: Validate Dates"])
    P22(["P2.2: Count Working Days"])
    P23(["P2.3: Check Leave Balance"])
    P24(["P2.4: Assign Priority"])
    P25(["P2.5: Create Leave Request"])

    DS_U[("D1: Users Store")]
    DS_LT[("D4: Leave Types")]
    DS_LR[("D2: Leave Requests")]

    ERR["ERROR: Insufficient Balance / Invalid Dates"]
    OK["201 Created - Success Response"]

    EMP -->|"type, start date, end date, reason"| P21
    P21 -->|"Valid dates"| P22
    P21 -->|"Invalid dates"| ERR
    P22 -->|"total working days"| P23
    P23 <-->|"Read leave_balances"| DS_U
    P23 -->|"Balance OK"| P24
    P23 -->|"Insufficient Balance"| ERR
    P24 <-->|"Get leave type name"| DS_LT
    P24 -->|"priority = high / medium / low"| P25
    P25 -->|"Write request - status pending"| DS_LR
    P25 -->|"Success response"| OK

    style EMP fill:#BBDEFB,stroke:#1565C0,stroke-width:2px
    style P21 fill:#F3E5F5,stroke:#6A1B9A
    style P22 fill:#F3E5F5,stroke:#6A1B9A
    style P23 fill:#F3E5F5,stroke:#6A1B9A
    style P24 fill:#F3E5F5,stroke:#6A1B9A
    style P25 fill:#F3E5F5,stroke:#6A1B9A
    style DS_U fill:#FFF8E1,stroke:#E65100
    style DS_LT fill:#FFF8E1,stroke:#E65100
    style DS_LR fill:#FFF8E1,stroke:#E65100
    style ERR fill:#FFCDD2,stroke:#C62828
    style OK fill:#C8E6C9,stroke:#2E7D32`;

// ── 5. USE CASE DIAGRAM ───────────────────────────────────────────────────────
const useCaseDiagram = `flowchart LR
    ACTE(["EMPLOYEE"])
    ACTA(["ADMIN"])

    subgraph SYS["Leave Management System"]
        subgraph EF["Employee Functions"]
            UC1["Register Account"]
            UC2["Apply for Leave"]
            UC3["View Leave History"]
            UC4["Cancel Leave Request"]
            UC5["View Leave Calendar"]
            UC6["View / Edit Profile"]
        end
        subgraph AF["Admin Functions"]
            UC7["Approve / Reject Registration"]
            UC8["Approve / Reject Leave"]
            UC9["Manage Leave Types"]
            UC10["Manage Departments"]
            UC11["View All Leave Requests"]
            UC12["View Reports and Analytics"]
        end
        subgraph AUTO["System Auto Functions"]
            UC13["Calculate Working Days"]
            UC14["Assign Leave Priority"]
            UC15["Deduct Leave Balance"]
        end
    end

    ACTE --- UC1
    ACTE --- UC2
    ACTE --- UC3
    ACTE --- UC4
    ACTE --- UC5
    ACTE --- UC6

    ACTA --- UC7
    ACTA --- UC8
    ACTA --- UC9
    ACTA --- UC10
    ACTA --- UC11
    ACTA --- UC12

    UC2 -.->|triggers| UC13
    UC2 -.->|triggers| UC14
    UC8 -.->|triggers| UC15

    style ACTE fill:#BBDEFB,stroke:#1565C0,stroke-width:2px
    style ACTA fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px`;

// ════════════════════════════════════════════════════════════════════════════
// RUN ALL
// ════════════════════════════════════════════════════════════════════════════
(async () => {
  const diagrams = [
    ['er_diagram.png',  erDiagram],
    ['dfd_level0.png',  dfd0],
    ['dfd_level1.png',  dfd1],
    ['dfd_level2.png',  dfd2],
    ['use_case.png',    useCaseDiagram],
  ];

  let ok = 0;
  for (const [file, code] of diagrams) {
    try {
      await generate(file, code);
      ok++;
    } catch (e) {
      console.error(`❌  ${file}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${diagrams.length} diagrams generated in screenshots/diagrams/`);
})();
