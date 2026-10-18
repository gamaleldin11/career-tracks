// The network interview map at /interview: the eleven topics from the hiring guide, each
// linked to the sections of the Connectivity track (and SD5.8) that cover it.
// Every `id` must exist in the built page; `node site/build.js --strict` fails otherwise.
// kind: 'read' (a section), 'qa' (model answers), 'deep' (deep dive), 'drill' (practice)

const TOPICS = [
  {
    n: 1, required: true, title: 'Networks', keys: ['TCP/IP', 'routing', 'switching', 'DNS', 'DHCP'],
    say: 'Bottom-up: a switch forwards frames by MAC inside a VLAN; a router forwards packets by IP between networks (longest prefix wins); DNS turns names into IPs; DHCP hands out IP, mask, gateway and DNS with DORA.',
    groups: [
      ['Foundations', [
        ['OSI model and the TCP/IP layers', 's-N1.5'],
        ['Encapsulation: segment → packet → frame', 's-N1.6'],
        ['Hub vs switch vs router', 's-N1.4'],
        ['TCP vs UDP, the handshake', 's-N3.1'],
        ['Ports to memorise', 's-N3.2'],
      ]],
      ['IP addressing', [
        ['IPv4 address and mask', 's-N2.2'],
        ['Subnetting: the method', 's-N2.4'],
        ['Local or remote? (the AND)', 's-N2.5'],
        ['NAT and PAT', 's-N2.6'],
        ['IPv6 essentials', 's-N2.7'],
      ]],
      ['Switching', [
        ['How a switch learns and forwards', 's-N4.1'],
        ['VLANs and 802.1Q trunks', 's-N4.2'],
        ['Inter-VLAN routing', 's-N4.3'],
        ['Spanning Tree (STP, RSTP, PortFast)', 's-N4.4'],
        ['LACP and port security', 's-N4.5'],
      ]],
      ['Routing', [
        ['What a router does with a packet', 's-N5.1'],
        ['Where routes come from (AD)', 's-N5.2'],
        ['OSPF vs EIGRP vs BGP', 's-N5.3'],
        ['Reading a routing decision', 's-N5.4'],
        ['First-hop redundancy (HSRP/VRRP)', 's-N5.5'],
      ]],
      ['DNS and DHCP', [
        ['DNS resolution', 's-N3.3'],
        ['DHCP DORA', 's-N3.4'],
        ['ARP', 's-N3.5'],
        ['Reading ipconfig /all line by line', 'N1-d11-reading-a-real-ipconfig-all-line-by-line', 'deep'],
        ['DNS tooling (nslookup, dig)', 'N3-d32-dns-tooling-annotated-real-outputs', 'deep'],
        ['DHCP relay and failure modes', 'N3-d33-dhcp-internals-failure-modes', 'deep'],
      ]],
      ['Practice', [
        ['Set piece: "what happens when you type a URL?"', 's-N3.9', 'drill'],
        ['Model answers: foundations', 'N1-interview-questions', 'qa'],
        ['Model answers: IP and subnetting', 'N2-interview-questions', 'qa'],
        ['Model answers: protocols', 'N3-interview-questions', 'qa'],
        ['Model answers: switching', 'N4-interview-questions', 'qa'],
        ['Model answers: routing', 'N5-interview-questions', 'qa'],
      ]],
    ],
  },
  {
    n: 2, required: true, title: 'OS: Linux and Windows', keys: ['CLI', 'logs', 'services', 'permissions'],
    say: 'Linux: systemctl status, journalctl -u and /var/log for services and logs; chmod 750 = rwx r-x ---. Windows: services.msc, Event Viewer (System 6008/1074, Security 4624/4625/4740), effective access = the stricter of share and NTFS.',
    groups: [
      ['Linux', [
        ['Orientation and the shell', 's-N11.1'],
        ['The filesystem tree', 's-N11.2'],
        ['Core commands by job', 's-N11.3'],
        ['Permissions (chmod, chown)', 's-N11.4'],
        ['Users and groups', 's-N11.5'],
        ['Processes and services (systemd)', 's-N11.6'],
        ['Networking on Linux', 's-N11.8'],
        ['Logs, cron, SSH, vi', 's-N11.10'],
        ['Reading top and free', 'N11-d111-reading-top-and-free-like-a-professional', 'deep'],
      ]],
      ['Windows and Active Directory', [
        ['Windows Server and the domain', 's-N12.1'],
        ['Active Directory structure', 's-N12.2'],
        ['Group Policy', 's-N12.3'],
        ['Daily AD tasks and lockouts', 's-N12.4'],
        ['Patching and endpoints', 's-N12.5'],
        ['Event IDs and commands', 'N12-d121-event-ids-and-commands-the-windows-support-', 'deep'],
        ['NTFS vs share permissions', 'N12-d123-ntfs-vs-share-permissions-the-worked-exampl', 'deep'],
      ]],
      ['Practice', [
        ['Three Linux scenarios (disk full, service down, slow)', 's-N11.11', 'drill'],
        ['Model answers: Linux', 'N11-interview-questions', 'qa'],
        ['Model answers: Windows and AD', 'N12-interview-questions', 'qa'],
      ]],
    ],
  },
  {
    n: 3, required: true, title: 'Storage', keys: ['RAID', 'SAN/NAS', 'iSCSI', 'Dell EMC'],
    say: 'NAS serves files (SMB/NFS) over the LAN; a SAN serves raw blocks (LUNs) over FC or iSCSI. RAID 1/10 mirror, RAID 5/6 use parity; RAID is not a backup. Dell: PowerStore midrange, PowerMax high end, PowerScale scale-out NAS, PowerProtect DD for backup.',
    groups: [
      ['Concepts', [
        ['Disks: HDD, SSD, NVMe', 's-N9.1'],
        ['RAID levels', 's-N9.2'],
        ['Block vs file vs object', 's-N9.3'],
        ['DAS, NAS, SAN; zoning and masking', 's-N9.4'],
        ['Thin provisioning, snapshots', 's-N9.5'],
        ['Backup: full, incremental, 3-2-1', 's-N9.6'],
      ]],
      ['iSCSI and arrays', [
        ['iSCSI end to end (+ multipathing)', 'N9-d91-iscsi-end-to-end-the-flow-you-can-narrate', 'deep'],
        ['Replication and DR', 'N9-replication-dr-the-level-above-backups', 'deep'],
        ['PERC hardware RAID and rebuilds', 's-N18.5'],
      ]],
      ['Dell EMC', [
        ['The Dell storage portfolio', 's-N9.7'],
      ]],
      ['Practice', [
        ['Model answers: storage', 'N9-interview-questions', 'qa'],
      ]],
    ],
  },
  {
    n: 4, required: true, title: 'Security', keys: ['firewalls', 'permissions', 'encryption'],
    say: 'A stateful firewall decides who may initiate what and lets replies back automatically; rules run top-down, first match wins, ending in a logged deny. Least privilege everywhere. Hashing is one-way, AES encrypts data, certificates and RSA/ECC prove identity; TLS uses both.',
    groups: [
      ['Firewalls and network security', [
        ['CIA triad, AAA, least privilege', 's-N7.1'],
        ['Firewalls: stateless, stateful, NGFW', 's-N7.2'],
        ['Firewall rule craft', 'N7-d71-firewall-rule-craft-what-good-policy-looks-l', 'deep'],
        ['ACLs', 's-N5.6'],
        ['Attacks to describe', 's-N7.3'],
        ['Hardening', 's-N7.4'],
        ['VPNs', 's-N6.3'],
      ]],
      ['Permissions', [
        ['Linux permissions', 's-N11.4'],
        ['NTFS vs share permissions', 'N12-d123-ntfs-vs-share-permissions-the-worked-exampl', 'deep'],
        ['Cloud identity and RBAC', 's-N19.5'],
      ]],
      ['Encryption', [
        ['Hashing, symmetric, asymmetric; how HTTPS uses them', 's-N7.5'],
        ['Identity and crypto vocabulary', 'N7-d73-identity-crypto-vocabulary-one-level-down', 'deep'],
        ['HTTPS and TLS', 's-N3.7'],
      ]],
      ['Practice', [
        ['Model answers: security', 'N7-interview-questions', 'qa'],
      ]],
    ],
  },
  {
    n: 5, required: true, title: 'Soft skills', keys: ['customer handling', 'communication'],
    say: 'Listen, acknowledge the impact, clarify, set expectations with a next update time, follow up. Never leave a customer without the next update time. Escalate early with evidence. Behavioural answers use STAR, with most of the time on what you did.',
    groups: [
      ['Customer handling', [
        ['The upset-customer call, step by step', 's-N13.5'],
        ['Ticket lifecycle', 's-N13.4'],
        ['ITIL ticket types', 's-N13.1'],
        ['SLAs and priority', 's-N13.2'],
      ]],
      ['Communication in the interview', [
        ['STAR behavioural answers', 's-N14.4'],
        ['Classic HR questions', 's-N14.3'],
        ['Phrase bank', 's-N14.7', 'drill'],
        ['What not to say', 's-N14.8'],
      ]],
    ],
  },
  {
    n: 6, required: false, title: 'Hardware', keys: ['BIOS', 'PSU', 'RAM', 'RAID', 'diagnostics'],
    say: 'Find the boot stage that failed: power, POST, UEFI, boot manager, OS. Read the iDRAC logs before touching anything. 1+1 PSUs on separate feeds; ECC corrects single-bit errors, and a rising count means replace the DIMM; minimum config to isolate.',
    groups: [
      ['Server hardware', [
        ['Inside a rack server', 's-N18.1'],
        ['BIOS, UEFI and POST', 's-N18.2'],
        ['Power supplies and feeds', 's-N18.3'],
        ['Memory and ECC', 's-N18.4'],
        ['Disks, PERC, hardware RAID', 's-N18.5'],
        ['Diagnostics: symptom to suspect', 's-N18.10'],
      ]],
      ['Practice', [
        ['Model answers: hardware and Dell', 'N18-interview-questions', 'qa'],
      ]],
    ],
  },
  {
    n: 7, required: false, title: 'Virtualization', keys: ['VMware', 'Hyper-V', 'virtual switches'],
    say: 'A Type 1 hypervisor (ESXi, Hyper-V) runs on bare metal. vMotion moves a running VM; HA restarts VMs after a host fails; DRS balances load. Hyper-V equivalents: Live Migration, Failover Clustering. Virtual switches use port groups and VLAN tags with physical uplinks.',
    groups: [
      ['VMware vSphere', [
        ['What virtualization is', 's-N10.1'],
        ['The vSphere product map', 's-N10.2'],
        ['Anatomy of a VM', 's-N10.3'],
        ['Storage in vSphere', 's-N10.4'],
        ['vMotion, HA, DRS, FT', 's-N10.6'],
        ['Resource management', 's-N10.7'],
        ['Everyday tasks and troubleshooting', 's-N10.8'],
        ['HA internals', 'N10-d103-ha-internals-storage-failure-states', 'deep'],
        ['Snapshot and vMotion edge cases', 'N10-d104-vmotion-snapshot-edge-cases-from-real-life', 'deep'],
      ]],
      ['Virtual switches', [
        ['Virtual networking (vSS, vDS)', 's-N10.5'],
        ['vSwitch security policies', 'N10-d105-vswitch-security-policies-the-three-toggles', 'deep'],
      ]],
      ['Hyper-V', [
        ['Hyper-V mapped to vSphere', 's-N10.9'],
      ]],
      ['Practice', [
        ['Model answers: VMware', 'N10-interview-questions', 'qa'],
      ]],
    ],
  },
  {
    n: 8, required: false, title: 'Cloud', keys: ['Azure/AWS basics', 'identity'],
    say: 'IaaS, PaaS, SaaS differ in what the provider runs; your data and identities are always yours (shared responsibility). Spread across availability zones. VPC/VNet + subnets + security groups/NSGs. Identity is the perimeter: least-privilege roles, MFA, managed identities.',
    groups: [
      ['Azure and AWS basics', [
        ['Service models, shared responsibility', 's-N19.1'],
        ['Regions and availability zones', 's-N19.2'],
        ['A cloud network end to end', 's-N19.3'],
        ['Core services side by side', 's-N19.4'],
        ['Talking about cloud as an associate', 's-N19.6'],
      ]],
      ['Identity', [
        ['IAM and Azure RBAC', 's-N19.5'],
        ['Hybrid identity (AD + Entra ID)', 'N12-hybrid-identity-the-modern-ad-conversation', 'deep'],
      ]],
      ['Practice', [
        ['Model answers: cloud', 'N19-interview-questions', 'qa'],
      ]],
    ],
  },
  {
    n: 9, required: false, title: 'Troubleshooting', keys: ['RCA', 'logs', 'methodology'],
    say: 'Scope first, then go bottom-up one layer at a time; change one thing and prove it; mitigate before the root-cause hunt. RCA: timeline, 5 whys, a problem record and a change that stops recurrence. Escalate with symptom, scope, evidence, what you tried, theory and one ask.',
    groups: [
      ['Method', [
        ['The method', 's-N8.1'],
        ['The toolkit by layer', 's-N8.2'],
        ['Scenario walkthroughs', 's-N8.3', 'drill'],
        ['The escalation package', 'N8-d84-the-escalation-package-copy-this-structure', 'deep'],
      ]],
      ['RCA and logs', [
        ['Major incidents and RCA (5 whys)', 'N13-d132-major-incidents-rca-how-grown-up-ops-behave', 'deep'],
        ['Monitoring that works', 'N13-d133-monitoring-that-works-and-the-kpis-on-your-', 'deep'],
        ['Linux logs', 's-N11.10'],
        ['Windows event IDs', 'N12-d121-event-ids-and-commands-the-windows-support-', 'deep'],
        ['Hardware diagnostics', 's-N18.10'],
      ]],
      ['Practice', [
        ['Model answers: troubleshooting', 'N8-interview-questions', 'qa'],
        ['The troubleshooting reflexes', 'N15-the-troubleshooting-reflexes', 'drill'],
      ]],
    ],
  },
  {
    n: 10, required: false, title: 'Dell tools', keys: ['iDRAC', 'OpenManage', 'SupportAssist'],
    say: 'iDRAC is the out-of-band controller in every PowerEdge: console, power, logs and firmware even when the OS is dead. Lifecycle Controller (F10) deploys and updates without an OS. OpenManage Enterprise manages the fleet. SupportAssist collects a TSR and opens Dell cases automatically.',
    groups: [
      ['The tools', [
        ['iDRAC: out-of-band management', 's-N18.6'],
        ['Lifecycle Controller', 's-N18.7'],
        ['OpenManage Enterprise', 's-N18.8'],
        ['SupportAssist and TSR', 's-N18.9'],
        ['racadm, Redfish and IPMI', 'N18-d181-racadm-redfish-and-ipmi-the-idrac-from-the-', 'deep'],
        ['Firmware updates without an outage', 'N18-d182-firmware-updates-without-an-outage', 'deep'],
      ]],
    ],
  },
  {
    n: 11, required: false, title: 'Scripting', keys: ['PowerShell', 'Bash fundamentals'],
    say: 'PowerShell pipes objects (sort by property, Export-Csv); Bash pipes text (grep, awk, sort). Parameters with defaults, deliberate error handling (try/catch, set -euo pipefail), -WhatIf before anything destructive, test on one machine, schedule with Task Scheduler or cron.',
    groups: [
      ['Fundamentals', [
        ['Why script', 's-N20.1'],
        ['PowerShell and Bash side by side', 's-N20.2'],
        ['Objects vs text', 's-N20.3'],
        ['A worked script in each', 's-N20.4'],
        ['Safety habits', 's-N20.5'],
        ['Scheduling and remoting', 's-N20.6'],
      ]],
      ['More examples', [
        ['An annotated bash script', 'N11-a-small-bash-script-fully-annotated-say-you-auto', 'deep'],
        ['The PowerShell dozen', 'N12-the-associates-powershell-dozen', 'deep'],
      ]],
      ['Practice', [
        ['Model answers: scripting', 'N20-interview-questions', 'qa'],
      ]],
    ],
  },
];

// Not one of the eleven topics: the material for the last hour before the interview.
const FINAL = [
  ['How the interview will flow', 'N0-how-the-interview-will-likely-flow'],
  ['Rapid-fire drill: 64 one-liners', 's-N14.5', 'drill'],
  ['A simulated technical interview', 's-N14.6', 'drill'],
  ['The 60-second summaries', 'N15-the-60-second-summaries', 'drill'],
  ['Ports table', 'N15-ports-table-the-memorization-set', 'drill'],
  ['Subnetting quick table', 'N15-subnetting-quick-table', 'drill'],
  ['Windows ↔ Linux commands', 'N15-command-translation-table-windows-linux', 'drill'],
  ['Interview-day checklist', 's-N14.9'],
];

module.exports = { TOPICS, FINAL };
