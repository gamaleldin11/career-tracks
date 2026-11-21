# Network & Connectivity — interview prep

*Short answers to the questions network, infrastructure and support interviews ask most.*

## Networking

### What happens when you type a URL into a browser?

The name is resolved through DNS, the client opens a TCP connection with a three-way handshake, negotiates TLS, then sends an HTTP request ([RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html), [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.5), [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)).

### TCP or UDP?

TCP gives reliable, ordered delivery with connection setup; UDP sends datagrams with no delivery guarantee and less overhead, which suits DNS queries and real-time media ([RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html), [RFC 768](https://www.rfc-editor.org/rfc/rfc768.html)).

### How does DHCP work?

Discover, offer, request, acknowledge: the client broadcasts, a server offers an address, the client requests it and the server confirms the lease ([RFC 2131](https://www.rfc-editor.org/rfc/rfc2131.html#section-3.1)).

### How many usable hosts are in a /26?

32 − 26 = 6 host bits, 64 addresses, minus network and broadcast = 62 hosts ([RFC 4632](https://www.rfc-editor.org/rfc/rfc4632.html)).

### What is the difference between a switch and a router?

A switch forwards frames by MAC address inside one network or VLAN; a router forwards packets between networks by the longest matching IP prefix ([RFC 7042](https://www.rfc-editor.org/rfc/rfc7042.html), [RFC 1812](https://www.rfc-editor.org/rfc/rfc1812.html#section-5.2.4.3)).

### What is a VLAN and a trunk?

A VLAN is a separate broadcast domain on shared switches; a trunk carries several VLANs on one link by adding an 802.1Q tag ([Cisco: IEEE 802.1Q frame format](https://www.cisco.com/c/en/us/support/docs/lan-switching/8021q/17056-741-4.html)).

### Why do we need spanning tree?

Redundant switch links create loops, and Ethernet frames have no TTL, so they would circulate forever; spanning tree blocks the extra paths ([Cisco: Rapid Spanning Tree Protocol](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html)).

### OSPF or BGP?

OSPF is a link-state protocol for routing inside one organisation; BGP is a path-vector protocol for routing between autonomous systems ([RFC 2328](https://www.rfc-editor.org/rfc/rfc2328.html), [RFC 4271](https://www.rfc-editor.org/rfc/rfc4271.html)).

## Troubleshooting

### A user cannot reach a website. Walk me through it.

Check the address (a 169.254 address means DHCP failed), ping the gateway, test DNS with nslookup, then test the port with Test-NetConnection; each step isolates one layer ([RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html), [Microsoft: nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup), [Microsoft: Test-NetConnection](https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection)).

### Ping works but the application does not. Why?

Ping proves only ICMP reachability; the service may be down, or a firewall may block its port ([RFC 792](https://www.rfc-editor.org/rfc/rfc792.html), [man7: ss](https://man7.org/linux/man-pages/man8/ss.8.html)).

### Users cannot log on to the domain. What do you check?

DNS first, because clients find domain controllers through SRV records; then time, because Kerberos rejects clocks more than 5 minutes apart by default ([Microsoft: DC locator](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/dc-locator), [Microsoft: Maximum tolerance for computer clock synchronization](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/maximum-tolerance-for-computer-clock-synchronization)).

### A Linux service will not start. What do you do?

Check its state with `systemctl status`, read its log with `journalctl -u`, and check the port with `ss` ([man7: systemctl](https://man7.org/linux/man-pages/man1/systemctl.1.html), [man7: journalctl](https://man7.org/linux/man-pages/man1/journalctl.1.html), [man7: ss](https://man7.org/linux/man-pages/man8/ss.8.html)).

## Infrastructure

### SAN or NAS?

A SAN presents block storage that a host formats like a local disk; a NAS shares files over SMB or NFS ([NIST SP 800-209](https://csrc.nist.gov/pubs/sp/800/209/final), [RFC 7143](https://www.rfc-editor.org/rfc/rfc7143.html)).

### Is RAID a backup? Is a snapshot?

Neither: RAID survives disk failure but copies deletions and corruption; snapshots depend on the original disks; keep separate backups under the 3-2-1 rule ([Broadcom KB 318825](https://knowledge.broadcom.com/external/article/318825), [CISA: Data backup options](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf)).

### What is the difference between RTO and RPO?

RTO is how long a system may stay down; RPO is how much recent data you can afford to lose ([NIST SP 800-34 Rev. 1](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)).

### vMotion, HA or DRS?

vMotion moves a running VM; HA restarts VMs after a host fails; DRS uses placement and vMotion to balance load ([Broadcom: Migrating virtual machines](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0/vcenter-and-host-management/migrating-virtual-machines.html), [Broadcom: vSphere HA provides rapid recovery from outages](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0/vsphere-availability/business-continuity-and-minimizing-downtime/vmware-ha-provides-rapid-recovery-from-outages.html), [Broadcom: Creating a DRS cluster](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0/vsphere-resource-management/creating-a-drs-cluster.html)).

### In what order does Group Policy apply?

Local, site, domain, then OU from parent to child; later policies override earlier ones ([Microsoft: Group Policy hierarchy](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/policy/group-policy-hierarchy)).

### What are IaaS, PaaS and SaaS?

You manage the operating system up in IaaS, only your application in PaaS, and only its use in SaaS; the provider runs the rest ([NIST SP 800-145](https://csrc.nist.gov/pubs/sp/800/145/final), [AWS: Shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/)).

## Security and operations

### Security group or network ACL?

Security groups are stateful and attach to instances; network ACLs are stateless and attach to subnets, so return traffic needs its own rule ([AWS: Security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html), [AWS: Network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)).

### Incident or problem?

Incident management restores service as fast as possible; problem management finds and removes the underlying cause ([PeopleCert: ITIL 4](https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1)).

### How do you make a risky change safely?

Assess its impact, test it, get approval, schedule it with a rollback plan, and record what was done ([NIST SP 800-128](https://csrc.nist.gov/pubs/sp/800/128/upd1/final)).

## Behavioural

### "Tell me about an outage you handled."

What broke, how you found the cause, how you restored service and what changed afterwards; structured interviews look for specific evidence of your own actions ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/), [Google SRE book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/)).
