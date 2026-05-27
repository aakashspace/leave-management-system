/**
 * generate-diagrams-v2.js
 * Generates proper DFD (L0, L1, L2), elaborated ERD, and Use Case Diagram
 * using kroki.io (Graphviz/DOT) for DFDs and mermaid.ink for ERD/Use Case.
 *
 * DFD Notation (Yourdon-DeMarco / Gane-Sarson hybrid):
 *   External Entity  →  rectangle  (shape=rectangle)
 *   Process          →  ellipse    (shape=ellipse, numbered)
 *   Data Store       →  open rect  (shape=none, HTML label, top+bottom borders only)
 *   Data Flow        →  arrow with label
 */

const https = require('https');
const http  = require('http');
const zlib  = require('zlib');
const fs    = require('fs');
const path  = require('path');

const outDir = path.join(__dirname, 'screenshots', 'diagrams');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function krokiUrl(dot) {
  return new Promise((resolve, reject) => {
    zlib.deflate(Buffer.from(dot), { level: 9 }, (err, compressed) => {
      if (err) return reject(err);
      const encoded = compressed.toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      resolve(`https://kroki.io/graphviz/png/${encoded}`);
    });
  });
}

function mermaidUrl(code) {
  const encoded = Buffer.from(code).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://mermaid.ink/img/${encoded}?bgColor=ffffff&type=png`;
}

async function generateKroki(filename, dot) {
  console.log(`⏳  Generating ${filename} (Graphviz)...`);
  const url = await krokiUrl(dot);
  const buf = await fetchUrl(url);
  if (buf.length < 200 || buf.slice(0, 4).toString('hex') !== '89504e47') {
    throw new Error(`${filename}: not a valid PNG. Response: ${buf.slice(0, 200).toString()}`);
  }
  fs.writeFileSync(path.join(outDir, filename), buf);
  console.log(`✅  ${filename}  (${Math.round(buf.length / 1024)} KB)`);
}

async function generateMermaid(filename, code) {
  console.log(`⏳  Generating ${filename} (Mermaid)...`);
  const buf = await fetchUrl(mermaidUrl(code));
  if (buf.length < 500 || buf.slice(0, 4).toString('hex') !== '89504e47') {
    throw new Error(`${filename}: not a valid PNG.`);
  }
  fs.writeFileSync(path.join(outDir, filename), buf);
  console.log(`✅  ${filename}  (${Math.round(buf.length / 1024)} KB)`);
}

// ─── Graphviz DFD helper: data store = open rectangle (top+bottom borders) ───
//
//  ┌────────────────────┐
//  │ D1 │  Users Store  │   ← Gane-Sarson style open-ended data store
//  └────────────────────┘
//
function dataStore(id, label) {
  return `${id} [shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR>
        <TD BORDER="1" SIDES="LTB" CELLPADDING="6"><FONT POINT-SIZE="10"><B>${id.replace('DS', 'D')}</B></FONT></TD>
        <TD BORDER="1" SIDES="RTB" CELLPADDING="6"><FONT POINT-SIZE="10"> ${label} </FONT></TD>
      </TR>
    </TABLE>
  >]`;
}

function externalEntity(id, label) {
  return `${id} [shape=rectangle, style="filled", fillcolor="#DDEEFF", color="#1565C0",
    penwidth=2, fontname="Arial Bold", fontsize=11, label="${label}"]`;
}

function process_(id, label) {
  // Circle with number inside
  return `${id} [shape=ellipse, style="filled", fillcolor="#E8F5E9", color="#2E7D32",
    penwidth=2, fontname="Arial", fontsize=10, label="${label}"]`;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. DFD LEVEL 0 — Context Diagram  (original layout)
// ════════════════════════════════════════════════════════════════════════════
const dfd0dot = `
digraph DFD_L0 {
  graph [layout=neato, bgcolor="white", overlap=false, splines=true, size="10,6"]
  node [fontname="Arial", fontsize=11]
  edge [fontname="Arial", fontsize=9, color="#444444"]

  EMP [pos="0,2!", shape=rectangle, style="filled", fillcolor="#BBDEFB",
       color="#1565C0", penwidth=2, fontname="Arial Bold", fontsize=12, label="EMPLOYEE"]
  SYS [pos="5,2!", shape=ellipse, style="filled", fillcolor="#E8EAF6",
       color="#3949AB", penwidth=2, fontname="Arial", fontsize=11,
       label="  0  \\nLeave Management\\nSystem"]
  ADM [pos="10,2!", shape=rectangle, style="filled", fillcolor="#C8E6C9",
       color="#2E7D32", penwidth=2, fontname="Arial Bold", fontsize=12, label="ADMINISTRATOR"]
  DB  [pos="5,0!", shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD BORDER="1" SIDES="LTB" CELLPADDING="6"><FONT POINT-SIZE="10"><B>DS</B></FONT></TD>
          <TD BORDER="1" SIDES="RTB" CELLPADDING="6"><FONT POINT-SIZE="10"> MongoDB Database </FONT></TD></TR>
    </TABLE>>]

  EMP -> SYS [label=" Registration /\\nLeave Application"]
  SYS -> EMP [label=" Status / Balance Info"]
  ADM -> SYS [label=" Approvals / Configuration"]
  SYS -> ADM [label=" Reports / User Management"]
  SYS -> DB  [label=" Read / Write", dir=both]
}
`;

// ════════════════════════════════════════════════════════════════════════════
// 2. DFD LEVEL 1 — neato with precisely pinned positions
//    Car Rental-style: EMP far-left | Processes centre-left column |
//    Data Stores centre-right (each aligned at same height as its process) |
//    ADM far-right at centre height
//    ONE data store per process — zero line crossings
// ════════════════════════════════════════════════════════════════════════════
const dfd1dot = `
digraph DFD_L1 {
  graph [layout=neato, bgcolor="white", overlap=false, splines=true, size="14,11"]
  node [fontname="Arial", fontsize=10]
  edge [fontname="Arial", fontsize=8.5, color="#333333", arrowsize=0.85]

  // ── EXTERNAL ENTITIES ────────────────────────────────────────────────
  EMP [pos="0,5.5!", shape=rectangle, style=filled, fillcolor=white,
       color="#111111", penwidth=2.5, fontname="Arial Bold", fontsize=11,
       label="Employee", width=1.35, height=0.75]
  ADM [pos="14,5.5!", shape=rectangle, style=filled, fillcolor=white,
       color="#111111", penwidth=2.5, fontname="Arial Bold", fontsize=11,
       label="Administrator", width=1.5, height=0.75]

  // ── PROCESSES — single vertical column at x=4.5 ──────────────────────
  P1 [pos="4.5,9.5!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
      color="#111111", penwidth=1.5, fontsize=9.5,
      label="1.0\nUser\nManagement", width=1.75, height=1.3]
  P2 [pos="4.5,7.5!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
      color="#111111", penwidth=1.5, fontsize=9.5,
      label="2.0\nLeave\nApplication", width=1.75, height=1.3]
  P3 [pos="4.5,5.5!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
      color="#111111", penwidth=1.5, fontsize=9.5,
      label="3.0\nLeave\nApproval", width=1.75, height=1.3]
  P4 [pos="4.5,3.5!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
      color="#111111", penwidth=1.5, fontsize=9.5,
      label="4.0\nReporting\n& Analytics", width=1.75, height=1.3]
  P5 [pos="4.5,1.5!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
      color="#111111", penwidth=1.5, fontsize=9.5,
      label="5.0\nConfig\nManagement", width=1.75, height=1.3]

  // ── DATA STORES — each pinned at the SAME height as its process ───────
  // Horizontal alignment means P→DS arrows are nearly horizontal lines
  DS1 [pos="10,9.5!", shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD BORDER="1" SIDES="LTB" CELLPADDING="7"><FONT POINT-SIZE="9.5"><B>D1</B></FONT></TD>
          <TD BORDER="1" SIDES="RTB" CELLPADDING="7"><FONT POINT-SIZE="9.5"> Users Store </FONT></TD></TR>
    </TABLE>>]
  DS2 [pos="10,6.5!", shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD BORDER="1" SIDES="LTB" CELLPADDING="7"><FONT POINT-SIZE="9.5"><B>D2</B></FONT></TD>
          <TD BORDER="1" SIDES="RTB" CELLPADDING="7"><FONT POINT-SIZE="9.5"> Leave Requests </FONT></TD></TR>
    </TABLE>>]
  DS3 [pos="10,3.5!", shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD BORDER="1" SIDES="LTB" CELLPADDING="7"><FONT POINT-SIZE="9.5"><B>D3</B></FONT></TD>
          <TD BORDER="1" SIDES="RTB" CELLPADDING="7"><FONT POINT-SIZE="9.5"> Departments </FONT></TD></TR>
    </TABLE>>]
  DS4 [pos="10,1.5!", shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD BORDER="1" SIDES="LTB" CELLPADDING="7"><FONT POINT-SIZE="9.5"><B>D4</B></FONT></TD>
          <TD BORDER="1" SIDES="RTB" CELLPADDING="7"><FONT POINT-SIZE="9.5"> Leave Types </FONT></TD></TR>
    </TABLE>>]

  // ── EMPLOYEE ↔ PROCESS (bidirectional arrows, one per process) ────────
  EMP -> P1 [dir=both, label="Registration Data /\nApproval Status"]
  EMP -> P2 [dir=both, label="Leave Application /\nConfirmation"]

  // ── PROCESS → DATA STORE (mostly horizontal — same height) ───────────
  // P1 ↔ D1:  y=9.5 ↔ y=9.5  — perfectly horizontal
  // P2 → D2:  y=7.5 → y=6.5  — slight diagonal
  // P3 → D2:  y=5.5 → y=6.5  — slight diagonal
  // P4 → D3:  y=3.5 ↔ y=3.5  — perfectly horizontal
  // P5 → D3:  y=1.5 → y=3.5  — short diagonal up
  // P5 → D4:  y=1.5 ↔ y=1.5  — perfectly horizontal
  P1 -> DS1 [dir=both, label=" User Data "]
  P2 -> DS2 [label=" New Request "]
  P3 -> DS2 [dir=both, label=" Update Status "]
  P4 -> DS3 [label=" Report Data "]
  P5 -> DS3 [dir=both, label=" Dept Config "]
  P5 -> DS4 [dir=both, label=" Type Config "]

  // ── ADMIN ↔ PROCESS (fan out from ADM at centre-right) ───────────────
  // ADM at (14, 5.5) fans out diagonally to each process — like Car Rental example
  ADM -> P1 [dir=both, label="Approve / Reject\nUser  "]
  ADM -> P3 [dir=both, label="Approve / Reject\nLeave  "]
  ADM -> P4 [dir=both, label="Reports  "]
  ADM -> P5 [dir=both, label="Config\nCommands  "]
}
`;

// ════════════════════════════════════════════════════════════════════════════
// 3. DFD LEVEL 2 — P2 (Leave Application) decomposed
//    neato layout: clockwise U-flow (top-left → top-right → right → bottom → left)
//    ERR box placed centre-left so error arrows stay short
//    Data stores aligned horizontally with their reading process
// ════════════════════════════════════════════════════════════════════════════
const dfd2dot = `
digraph DFD_L2 {
  graph [layout=neato, bgcolor="white", overlap=false, splines=true, size="15,9"]
  node [fontname="Arial", fontsize=10]
  edge [fontname="Arial", fontsize=8, color="#333333", arrowsize=0.85]

  // ── EXTERNAL ENTITY ───────────────────────────────────────────────────
  EMP [pos="0,4.5!", shape=rectangle, style=filled, fillcolor=white,
       color="#111111", penwidth=2.5, fontname="Arial Bold", fontsize=11,
       label="Employee", width=1.3, height=0.75]

  // ── SUB-PROCESSES — clockwise U-flow ─────────────────────────────────
  //   Top row   : P21(left) → P22(right)        (input validation)
  //   Right col : P23 → P24                     (balance + priority)
  //   Bottom    : P25                            (write request)
  P21 [pos="3.5,8!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
       color="#111111", penwidth=1.5, fontsize=9.5,
       label="2.1\nValidate\nDates", width=1.65, height=1.3]
  P22 [pos="8,8!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
       color="#111111", penwidth=1.5, fontsize=9.5,
       label="2.2\nCount\nWorking Days", width=1.65, height=1.3]
  P23 [pos="12,6!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
       color="#111111", penwidth=1.5, fontsize=9.5,
       label="2.3\nCheck\nLeave Balance", width=1.65, height=1.3]
  P24 [pos="12,3!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
       color="#111111", penwidth=1.5, fontsize=9.5,
       label="2.4\nAssign\nPriority", width=1.65, height=1.3]
  P25 [pos="8,0.5!", shape=ellipse, style=filled, fillcolor="#F0F0F0",
       color="#111111", penwidth=1.5, fontsize=9.5,
       label="2.5\nCreate\nRequest", width=1.65, height=1.3]

  // ── DATA STORES — aligned horizontally with their process ─────────────
  DS1 [pos="15,6!", shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD BORDER="1" SIDES="LTB" CELLPADDING="6"><FONT POINT-SIZE="9.5"><B>D1</B></FONT></TD>
          <TD BORDER="1" SIDES="RTB" CELLPADDING="6"><FONT POINT-SIZE="9.5"> Users Store </FONT></TD></TR>
    </TABLE>>]
  DS4 [pos="15,3!", shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD BORDER="1" SIDES="LTB" CELLPADDING="6"><FONT POINT-SIZE="9.5"><B>D4</B></FONT></TD>
          <TD BORDER="1" SIDES="RTB" CELLPADDING="6"><FONT POINT-SIZE="9.5"> Leave Types </FONT></TD></TR>
    </TABLE>>]
  DS2 [pos="12,0.5!", shape=none, margin=0, label=<
    <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD BORDER="1" SIDES="LTB" CELLPADDING="6"><FONT POINT-SIZE="9.5"><B>D2</B></FONT></TD>
          <TD BORDER="1" SIDES="RTB" CELLPADDING="6"><FONT POINT-SIZE="9.5"> Leave Requests </FONT></TD></TR>
    </TABLE>>]

  // ── RESPONSE NODES ────────────────────────────────────────────────────
  // ERR placed centre-left so arrows from P21 and P23 are short
  ERR [pos="6,4.5!", shape=rectangle, style=filled, fillcolor="#F0F0F0",
       color="#555555", penwidth=1.5, fontname="Arial", fontsize=9,
       label="Error Response\n(HTTP 400)", width=1.6, height=0.75]
  OK  [pos="3.5,0.5!", shape=rectangle, style=filled, fillcolor="#F0F0F0",
       color="#555555", penwidth=1.5, fontname="Arial", fontsize=9,
       label="Success Response\n(HTTP 201)", width=1.6, height=0.75]

  // ── SEQUENTIAL FLOW ───────────────────────────────────────────────────
  EMP -> P21 [label=" Application Data "]
  P21 -> P22 [label=" Valid Dates "]
  P22 -> P23 [label=" Total Working Days "]
  P23 -> P24 [label=" Balance OK "]
  P24 -> P25 [label=" Priority Level "]

  // ── DATA STORE ACCESS ─────────────────────────────────────────────────
  P23 -> DS1 [label=" Read Balance ", dir=both]
  P24 -> DS4 [label=" Get Type ", dir=both]
  P25 -> DS2 [label=" Write Request "]

  // ── ERROR PATHS — both converge on ERR (centre-left) ─────────────────
  P21 -> ERR [label=" Invalid Dates "]
  P23 -> ERR [label=" Insufficient Balance "]
  ERR -> EMP [label=" Error Response "]

  // ── SUCCESS PATH ──────────────────────────────────────────────────────
  P25 -> OK [label=" Created "]
  OK  -> EMP [label=" Confirmation "]
}
`;

// ════════════════════════════════════════════════════════════════════════════
// 4. ELABORATED ERD — Chen notation via Graphviz
//    Orange rectangles = Entities, Orange diamonds = Relationships,
//    Green ovals = Attributes, Blue rectangle = Embedded entity
//    1/M cardinality labels on relationship lines
// ════════════════════════════════════════════════════════════════════════════
const erDot = `
graph ER {
  bgcolor="white"
  node [fontname="Arial", fontsize=11]
  edge [fontname="Arial", fontsize=10, color="#555555"]
  splines=spline
  overlap=false
  sep="+20"

  // ── ENTITIES (orange rectangles) ──────────────────────────────────────
  USER [shape=rectangle, style="filled", fillcolor="#FFA726", fontcolor="white",
        fontname="Arial Bold", fontsize=14, label="USER"]
  DEPT [shape=rectangle, style="filled", fillcolor="#FFA726", fontcolor="white",
        fontname="Arial Bold", fontsize=14, label="DEPARTMENT"]
  LT   [shape=rectangle, style="filled", fillcolor="#FFA726", fontcolor="white",
        fontname="Arial Bold", fontsize=14, label="LEAVE TYPE"]
  LR   [shape=rectangle, style="filled", fillcolor="#FFA726", fontcolor="white",
        fontname="Arial Bold", fontsize=14, label="LEAVE REQUEST"]
  LB   [shape=rectangle, style="filled", fillcolor="#42A5F5", fontcolor="white",
        fontname="Arial Bold", fontsize=12, label="LEAVE BALANCE\\n(Embedded in USER)"]

  // ── RELATIONSHIPS (orange diamonds) ───────────────────────────────────
  EMPLOYS [shape=diamond, style="filled", fillcolor="#FFA726", fontcolor="white",
           fontname="Arial Bold", fontsize=11, label="employs"]
  SUBMITS [shape=diamond, style="filled", fillcolor="#FFA726", fontcolor="white",
           fontname="Arial Bold", fontsize=11, label="submits"]
  CATEG   [shape=diamond, style="filled", fillcolor="#FFA726", fontcolor="white",
           fontname="Arial Bold", fontsize=11, label="categorises"]
  HAS_BAL [shape=diamond, style="filled", fillcolor="#FFA726", fontcolor="white",
           fontname="Arial Bold", fontsize=10, label="has\\n(embedded)"]
  TRACKED [shape=diamond, style="filled", fillcolor="#FFA726", fontcolor="white",
           fontname="Arial Bold", fontsize=11, label="tracked in"]

  // ── ATTRIBUTES — USER (green ovals) ───────────────────────────────────
  u_id     [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="_id (PK)"]
  u_name   [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="name"]
  u_email  [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="email (Unique)"]
  u_role   [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="role"]
  u_status [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="status"]

  // ── ATTRIBUTES — DEPARTMENT ────────────────────────────────────────────
  d_id   [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="_id (PK)"]
  d_name [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="dept_name"]

  // ── ATTRIBUTES — LEAVE TYPE ────────────────────────────────────────────
  lt_id     [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="_id (PK)"]
  lt_name   [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="name"]
  lt_days   [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="max_paid_days"]
  lt_color  [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="color_code"]
  lt_active [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="is_active"]

  // ── ATTRIBUTES — LEAVE REQUEST ─────────────────────────────────────────
  lr_id       [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="_id (PK)"]
  lr_start    [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="start_date"]
  lr_end      [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="end_date"]
  lr_days     [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="total_days"]
  lr_paid     [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="is_paid"]
  lr_reason   [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="reason"]
  lr_status   [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="status"]
  lr_priority [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="priority"]
  lr_comment  [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="admin_comment"]

  // ── ATTRIBUTES — LEAVE BALANCE ─────────────────────────────────────────
  lb_tid  [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="leave_type_id (FK)"]
  lb_tot  [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="total_days"]
  lb_used [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="used_days"]
  lb_rem  [shape=ellipse, style="filled", fillcolor="#8BC34A", fontsize=10, label="remaining_days"]

  // ── Entity → Attribute connections ────────────────────────────────────
  USER -- u_id
  USER -- u_name
  USER -- u_email
  USER -- u_role
  USER -- u_status

  DEPT -- d_id
  DEPT -- d_name

  LT -- lt_id
  LT -- lt_name
  LT -- lt_days
  LT -- lt_color
  LT -- lt_active

  LR -- lr_id
  LR -- lr_start
  LR -- lr_end
  LR -- lr_days
  LR -- lr_paid
  LR -- lr_reason
  LR -- lr_status
  LR -- lr_priority
  LR -- lr_comment

  LB -- lb_tid
  LB -- lb_tot
  LB -- lb_used
  LB -- lb_rem

  // ── Relationships with cardinality ─────────────────────────────────────
  DEPT -- EMPLOYS [label="1"]
  EMPLOYS -- USER [label="M"]

  USER -- SUBMITS [label="1"]
  SUBMITS -- LR   [label="M"]

  LT -- CATEG   [label="1"]
  CATEG -- LR   [label="M"]

  USER -- HAS_BAL [label="1"]
  HAS_BAL -- LB   [label="M"]

  LT -- TRACKED  [label="1"]
  TRACKED -- LB  [label="M"]
}`;

// ════════════════════════════════════════════════════════════════════════════
// 5. USE CASE DIAGRAM — unchanged
// ════════════════════════════════════════════════════════════════════════════
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
  let ok = 0, total = 0;

  const krokiDiagrams = [
    ['dfd_level0.png', dfd0dot],
    ['dfd_level1.png', dfd1dot],
    ['dfd_level2.png', dfd2dot],
    ['er_diagram.png', erDot],
  ];

  const mermaidDiagrams = [
    ['use_case.png',   useCaseDiagram],
  ];

  for (const [file, dot] of krokiDiagrams) {
    total++;
    try { await generateKroki(file, dot); ok++; }
    catch (e) { console.error(`❌  ${file}: ${e.message}`); }
  }

  for (const [file, code] of mermaidDiagrams) {
    total++;
    try { await generateMermaid(file, code); ok++; }
    catch (e) { console.error(`❌  ${file}: ${e.message}`); }
  }

  console.log(`\nDone: ${ok}/${total} diagrams generated → screenshots/diagrams/`);
})();
