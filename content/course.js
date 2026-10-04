// The single source of truth for the course structure.
// Every module is one Markdown file in content/modules, named <id>_<anything>.md,
// except the AI (ai: part number) and N (net: true) modules, which site/sources.js
// imports from content/ai-journey and content/connectivity-bootcamp.
//
// To add a topic:  write content/modules/<ID>_<Name>.md, add <ID> to MODULES and
// LEVEL below, put it in one or more tracks, and add questions in quizzes.js.
// To add a track:  add an entry to TRACKS (a new id) and a list in quizzes.js.
// `npm run build` warns about any step that was missed.
// A module can belong to several tracks; progress is tracked per module, so a
// shared module ticked in one track shows as done in every track that uses it.

const MODULES = {
  // ---- start
  '00': { short: 'Start here', file: '00_Start_Here.md' },

  // ---- shared core
  S1: { short: 'How the web works', file: 'S1_How_The_Web_Works.md' },
  S2: { short: 'Git & team workflow', file: 'S2_Git_And_Team_Workflow.md' },
  S3: { short: 'SQL core', file: 'S3_SQL_Core.md' },
  S4: { short: 'DSA for interviews', file: 'S4_DSA_For_Interviews.md' },
  S5: { short: 'Linux, shell & Docker', file: 'S5_Linux_Shell_Docker.md' },
  S6: { short: 'Statistics & A/B tests', file: 'S6_Statistics_And_AB_Testing.md' },
  S7: { short: 'Python for data', file: 'S7_Python_For_Data.md' },
  S8: { short: 'Behavioural & Egypt hiring', file: 'S8_Behavioural_And_Egypt_Hiring.md' },
  S9: { short: 'Web security (OWASP)', file: 'S9_Web_Security.md' },
  S10: { short: 'Cloud, CI/CD & DevOps', file: 'S10_Cloud_CICD_DevOps.md' },

  // ---- system design (shared by every track; fundamentals first, depth where a role needs it)
  SD1: { short: 'System design fundamentals', file: 'SD1_System_Design_Fundamentals.md' },
  SD2: { short: 'Scaling in production', file: 'SD2_Scaling_In_Production.md' },
  SD3: { short: 'Choosing technologies', file: 'SD3_Choosing_Technologies.md' },
  SD4: { short: 'Reliability & distributed patterns', file: 'SD4_Reliability_And_Distributed_Patterns.md' },
  SD5: { short: 'System design by role', file: 'SD5_System_Design_By_Role.md' },

  // ---- frontend
  F1: { short: 'HTML & accessibility', file: 'F1_HTML_And_Accessibility.md' },
  F2: { short: 'CSS & layout', file: 'F2_CSS_And_Layout.md' },
  F3: { short: 'JavaScript core', file: 'F3_JavaScript_Core.md' },
  F4: { short: 'Async JS & the browser', file: 'F4_Async_JS_And_Browser.md' },
  F5: { short: 'TypeScript', file: 'F5_TypeScript.md' },
  F6: { short: 'React', file: 'F6_React.md' },
  F7: { short: 'Angular', file: 'F7_Angular.md' },
  F8: { short: 'State, data & forms', file: 'F8_State_Data_Forms.md' },
  F9: { short: 'Performance & rendering', file: 'F9_Performance_And_Rendering.md' },
  F10: { short: 'Frontend testing', file: 'F10_Frontend_Testing.md' },
  F11: { short: 'Frontend interview hub', file: 'F11_Frontend_Interview_Hub.md' },

  // ---- backend
  B1: { short: 'C# & .NET runtime', file: 'B1_CSharp_And_DotNet.md' },
  B2: { short: 'OOP, SOLID & patterns', file: 'B2_OOP_SOLID_Patterns.md' },
  B3: { short: 'ASP.NET Core Web API', file: 'B3_AspNetCore_Web_API.md' },
  B4: { short: 'API design', file: 'B4_API_Design.md' },
  B5: { short: 'EF Core & data access', file: 'B5_EF_Core_Data_Access.md' },
  B6: { short: 'Database design & tuning', file: 'B6_Database_Design_Tuning.md' },
  B7: { short: 'Auth: identity, JWT, OAuth', file: 'B7_Auth.md' },
  B8: { short: 'Caching, queues & jobs', file: 'B8_Caching_Queues_Jobs.md' },
  B9: { short: 'Architecture', file: 'B9_Architecture.md' },
  B10: { short: 'Backend testing', file: 'B10_Backend_Testing.md' },
  B11: { short: 'Observability & resilience', file: 'B11_Observability_Resilience.md' },
  B12: { short: 'System design', file: 'B12_System_Design.md' },
  B13: { short: 'Node.js for .NET devs', file: 'B13_NodeJS.md' },
  B14: { short: 'Backend interview hub', file: 'B14_Backend_Interview_Hub.md' },

  // ---- full stack
  FS1: { short: 'Full-stack architecture', file: 'FS1_Fullstack_Architecture.md' },
  FS2: { short: 'Auth & CORS end to end', file: 'FS2_Auth_End_To_End.md' },
  FS3: { short: 'Real-world features', file: 'FS3_Real_World_Features.md' },
  FS4: { short: 'Ship it: deploy & operate', file: 'FS4_Ship_It.md' },
  FS5: { short: 'Full-stack interview hub', file: 'FS5_Fullstack_Interview_Hub.md' },

  // ---- data analyst
  DA1: { short: 'Analytics thinking & KPIs', file: 'DA1_Analytics_Thinking_KPIs.md' },
  DA2: { short: 'Excel for analysts', file: 'DA2_Excel.md' },
  DA3: { short: 'SQL for analytics', file: 'DA3_SQL_For_Analytics.md' },
  DA4: { short: 'Power BI & DAX', file: 'DA4_Power_BI_DAX.md' },
  DA5: { short: 'Visualisation & storytelling', file: 'DA5_Visualisation_Storytelling.md' },
  DA6: { short: 'Product analytics & experiments', file: 'DA6_Product_Analytics.md' },
  DA7: { short: 'Analyst interview hub', file: 'DA7_Analyst_Interview_Hub.md' },

  // ---- data scientist
  DS1: { short: 'Framing DS problems', file: 'DS1_Framing_Problems.md' },
  DS2: { short: 'Features & leakage', file: 'DS2_Features_And_Leakage.md' },
  DS3: { short: 'Models that win on tables', file: 'DS3_Models_For_Tabular.md' },
  DS4: { short: 'Evaluation & error analysis', file: 'DS4_Evaluation.md' },
  DS5: { short: 'Causal inference', file: 'DS5_Causal_Inference.md' },
  DS6: { short: 'Forecasting', file: 'DS6_Forecasting.md' },
  DS7: { short: 'Segments, text & LLMs', file: 'DS7_Text_Embeddings_LLMs.md' },
  DS8: { short: 'ML in production', file: 'DS8_ML_In_Production.md' },
  DS9: { short: 'Data scientist interview hub', file: 'DS9_DS_Interview_Hub.md' },

  // ---- data engineer
  DE1: { short: 'The data platform', file: 'DE1_The_Data_Platform.md' },
  DE2: { short: 'Data modelling', file: 'DE2_Data_Modelling.md' },
  DE3: { short: 'SQL for pipelines', file: 'DE3_SQL_For_Pipelines.md' },
  DE4: { short: 'Python for pipelines', file: 'DE4_Python_For_Pipelines.md' },
  DE5: { short: 'Formats, lakes & warehouses', file: 'DE5_Formats_Lakes_Warehouses.md' },
  DE6: { short: 'Spark', file: 'DE6_Spark.md' },
  DE7: { short: 'Orchestration & dbt', file: 'DE7_Orchestration_dbt.md' },
  DE8: { short: 'Streaming & Kafka', file: 'DE8_Streaming_Kafka.md' },
  DE9: { short: 'Quality & governance', file: 'DE9_Quality_Governance.md' },
  DE10: { short: 'Data engineer interview hub', file: 'DE10_DE_Interview_Hub.md' },

  // ---- AI engineer: content/ai-journey/parts (part number → file NN_*.md)
  AI0: { short: 'Start here (AI path)', ai: '00' },
  AI1: { short: 'Python', ai: '01' },
  AI2: { short: 'NumPy', ai: '02' },
  AI3: { short: 'Pandas', ai: '03' },
  AI4: { short: 'Cleaning & preprocessing', ai: '04' },
  AI5: { short: 'Visualisation & EDA', ai: '05' },
  AI6: { short: 'ML foundations', ai: '06' },
  AI7: { short: 'Regression', ai: '07' },
  AI8: { short: 'Classification', ai: '08' },
  AI8B: { short: 'Trees & ensembles', ai: '08B' },
  AI9: { short: 'Unsupervised', ai: '09' },
  AI10: { short: 'NLP & Arabic', ai: '10' },
  AI11: { short: 'Neural networks', ai: '11' },
  AI12: { short: 'SQL for data', ai: '12' },
  AI13: { short: 'Capstone: road accidents', ai: '13' },
  AI14: { short: 'Gaps & next steps', ai: '14' },
  AI15: { short: 'Statistics & A/B tests', ai: '15' },
  AI16: { short: 'AI interview hub (e&)', ai: '16' },
  AI17: { short: 'Training deep nets', ai: '17' },
  AI18: { short: 'CNNs & vision', ai: '18' },
  AI19: { short: 'Time series & RNNs', ai: '19' },
  AI20: { short: 'NLP + attention', ai: '20' },
  AI21: { short: 'Transformers, LLMs, RAG', ai: '21' },
  AI22: { short: 'ViT & multimodal', ai: '22' },
  AI23: { short: 'Generative models', ai: '23' },
  AI24: { short: 'RL & bandits', ai: '24' },
  AI25: { short: 'SOTA roadmap', ai: '25' },

  // ---- network & connectivity: content/connectivity-bootcamp/connectivity-bootcamp.html (section m0…m16)
  N0: { short: 'Orientation & study plan', net: true },
  N1: { short: 'Networking foundations', net: true },
  N2: { short: 'IP addressing & subnetting', net: true },
  N3: { short: 'Protocols & services', net: true },
  N4: { short: 'Switching & VLANs', net: true },
  N5: { short: 'Routing', net: true },
  N6: { short: 'Wi-Fi, WAN & VPN', net: true },
  N7: { short: 'Network security & firewalls', net: true },
  N8: { short: 'Network troubleshooting', net: true },
  N9: { short: 'Storage', net: true },
  N10: { short: 'VMware & virtualisation', net: true },
  N11: { short: 'Linux', net: true },
  N12: { short: 'Windows & Active Directory', net: true },
  N13: { short: 'IT operations & ITIL', net: true },
  N14: { short: 'Capgemini & the interview', net: true },
  N15: { short: 'Cheat sheets', net: true },
  N16: { short: 'Network glossary', net: true },
};

// Each track is an ordered path of stages. The order is the reading order.
const TRACKS = [
  {
    id: 'fe', name: 'Frontend Developer', blurb: 'Accessible, fast interfaces in React and Angular, and the JavaScript underneath them.',
    stages: [
      ['Foundations', ['S1', 'S2', 'F1', 'F2']],
      ['The language', ['F3', 'F4', 'F5']],
      ['Frameworks', ['F6', 'F7', 'F8']],
      ['Quality', ['F9', 'F10', 'S9']],
      ['System design', ['SD1', 'SD2', 'SD3', 'SD5']],
      ['Interview', ['S4', 'S8', 'F11']],
    ],
  },
  {
    id: 'be', name: 'Backend Developer', blurb: 'ASP.NET Core APIs, data, security and the system design that holds them up.',
    stages: [
      ['Foundations', ['S1', 'S2', 'S3', 'S5']],
      ['The platform', ['B1', 'B2', 'B3', 'B4']],
      ['Data', ['B5', 'B6']],
      ['Production concerns', ['B7', 'S9', 'B8', 'B11']],
      ['Design & quality', ['B9', 'B10', 'S10']],
      ['System design', ['SD1', 'SD2', 'SD3', 'SD4', 'B12']],
      ['Interview', ['B13', 'S4', 'S8', 'B14']],
    ],
  },
  {
    id: 'fs', name: 'Full-Stack Developer', blurb: 'Angular or React on the front, ASP.NET Core or Node on the back, and everything that joins them.',
    stages: [
      ['Foundations', ['S1', 'S2', 'S3', 'S5']],
      ['Frontend', ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']],
      ['Backend', ['B1', 'B3', 'B4', 'B5', 'B7', 'B13']],
      ['Joining the halves', ['FS1', 'FS2', 'FS3', 'S9']],
      ['Shipping', ['B8', 'B10', 'F10', 'S10', 'FS4']],
      ['System design', ['SD1', 'SD2', 'SD3', 'SD4', 'B12']],
      ['Interview', ['S4', 'S8', 'FS5']],
    ],
  },
  {
    id: 'da', name: 'Data Analyst', blurb: 'From a business question to SQL, Excel, Power BI and a decision someone acts on.',
    stages: [
      ['The job', ['DA1']],
      ['Tools', ['S3', 'DA3', 'DA2', 'DA4', 'S7']],
      ['Analysis', ['S6', 'DA5', 'DA6']],
      ['System design', ['SD1', 'SD2', 'SD5']],
      ['Interview', ['S8', 'DA7']],
    ],
  },
  {
    id: 'ds', name: 'Data Scientist', blurb: 'Framing, features, models, experiments and causal thinking, then putting a model to work.',
    stages: [
      ['Toolkit', ['S7', 'S3', 'S6', 'S2']],
      ['Modelling', ['DS1', 'DS2', 'DS3', 'DS4']],
      ['Beyond prediction', ['DS5', 'DS6', 'DS7']],
      ['Production', ['DS8']],
      ['System design', ['SD1', 'SD2', 'SD3', 'SD5']],
      ['Interview', ['S8', 'DS9']],
    ],
  },
  {
    id: 'de', name: 'Data Engineer', blurb: 'Reliable pipelines: modelling, SQL, Python, Spark, orchestration, streaming and quality.',
    stages: [
      ['Foundations', ['DE1', 'S3', 'S2', 'S5']],
      ['Modelling & code', ['DE2', 'DE3', 'S7', 'DE4']],
      ['Platforms', ['DE5', 'DE6', 'DE7', 'DE8']],
      ['Operate', ['DE9', 'S10']],
      ['System design', ['SD1', 'SD2', 'SD3', 'SD4', 'SD5']],
      ['Interview', ['S8', 'DE10']],
    ],
  },
  {
    id: 'ai', name: 'AI Engineer', blurb: 'The AI Journey handbook: Python and data, classical ML, deep learning, then transformers, LLMs, RAG and agents.',
    stages: [
      ['Start', ['AI0']],
      ['Toolkit', ['AI1', 'AI2', 'AI3', 'AI12']],
      ['Data & statistics', ['AI4', 'AI5', 'AI15']],
      ['Classical ML', ['AI6', 'AI7', 'AI8', 'AI8B', 'AI9']],
      ['Applied ML', ['AI10', 'AI11', 'AI13']],
      ['Deep learning', ['AI17', 'AI18', 'AI19', 'AI20']],
      ['Modern AI', ['AI21', 'AI22', 'AI23', 'AI24']],
      ['System design', ['SD1', 'SD2', 'SD3', 'SD4', 'SD5']],
      ['Interview & beyond', ['AI25', 'AI14', 'AI16']],
    ],
  },
  {
    id: 'net', name: 'Network & Connectivity Engineer', blurb: 'The Connectivity Bootcamp: networks, storage, VMware, Linux, Windows and AD, security and ITIL for infrastructure support roles.',
    stages: [
      ['Start', ['N0']],
      ['Networks', ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8']],
      ['Infrastructure', ['N9', 'N10', 'N11', 'N12']],
      ['System design', ['SD1', 'SD2', 'SD4', 'SD5']],
      ['Operations & interview', ['N13', 'N14']],
      ['Quick reference', ['N15', 'N16']],
    ],
  },
];

// Highest level at which a module is usually tested; drives the sidebar bars.
const LEVEL = {
  S1: 'E', S2: 'E', S3: 'E', S4: 'E', S5: 'E', S6: 'E', S7: 'E', S8: 'E', S9: 'M', S10: 'M',
  SD1: 'E', SD2: 'E', SD3: 'M', SD4: 'M', SD5: 'M',
  F1: 'E', F2: 'E', F3: 'E', F4: 'E', F5: 'E', F6: 'E', F7: 'E', F8: 'M', F9: 'M', F10: 'M', F11: 'E',
  B1: 'E', B2: 'E', B3: 'E', B4: 'E', B5: 'E', B6: 'M', B7: 'M', B8: 'M', B9: 'M', B10: 'M', B11: 'M', B12: 'M', B13: 'E', B14: 'E',
  FS1: 'M', FS2: 'M', FS3: 'M', FS4: 'M', FS5: 'E',
  DA1: 'E', DA2: 'E', DA3: 'E', DA4: 'E', DA5: 'E', DA6: 'M', DA7: 'E',
  DS1: 'E', DS2: 'E', DS3: 'E', DS4: 'E', DS5: 'M', DS6: 'M', DS7: 'M', DS8: 'M', DS9: 'E',
  DE1: 'E', DE2: 'E', DE3: 'E', DE4: 'E', DE5: 'M', DE6: 'M', DE7: 'M', DE8: 'M', DE9: 'M', DE10: 'E',
  // AI Journey: the levels its own sidebar used
  AI1: 'E', AI2: 'E', AI3: 'E', AI4: 'E', AI5: 'E', AI6: 'E', AI7: 'E', AI8: 'E', AI8B: 'M', AI9: 'M', AI10: 'M', AI11: 'M',
  AI12: 'E', AI13: 'E', AI15: 'E', AI16: 'E', AI17: 'M', AI18: 'S', AI19: 'M', AI20: 'M', AI21: 'M', AI22: 'S', AI23: 'S', AI24: 'S', AI25: 'E',
  // Bootcamp: written for an associate (0–3 years) role
  N1: 'E', N2: 'E', N3: 'E', N4: 'E', N5: 'E', N6: 'E', N7: 'E', N8: 'E', N9: 'E', N10: 'E', N11: 'E', N12: 'E', N13: 'E', N14: 'E',
};

module.exports = { MODULES, TRACKS, LEVEL };
