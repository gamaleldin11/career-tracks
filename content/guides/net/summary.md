# Network & Connectivity — super summary

## Networks

- The OSI model splits communication into seven layers; the Internet's own architecture uses four: link, internet, transport and application ([ITU-T X.200](https://www.itu.int/rec/T-REC-X.200-199407-I/en), [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122.html)).
- IPv4 addresses are 32 bits; CIDR writes a network as an address and a prefix length such as 10.0.0.0/8 ([RFC 791](https://www.rfc-editor.org/rfc/rfc791.html), [RFC 4632](https://www.rfc-editor.org/rfc/rfc4632.html)).
- 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 are private ranges, reachable from the Internet only through NAT ([RFC 1918](https://www.rfc-editor.org/rfc/rfc1918.html#section-3), [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022.html)).
- IPv6 addresses are 128 bits and IPv6 has no broadcast, only unicast, anycast and multicast ([RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.html)).
- ARP maps an IPv4 address to a MAC address on the local link; IPv6 uses Neighbor Discovery instead ([RFC 826](https://www.rfc-editor.org/rfc/rfc826.html), [RFC 4861](https://www.rfc-editor.org/rfc/rfc4861.html)).
- DHCP leases addresses in four messages: discover, offer, request, acknowledge ([RFC 2131](https://www.rfc-editor.org/rfc/rfc2131.html#section-3.1)).
- DNS turns names into records such as A, AAAA, CNAME and MX ([RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html#section-3.2.2), [RFC 3596](https://www.rfc-editor.org/rfc/rfc3596.html)).
- TCP opens a connection with a three-way handshake and delivers bytes reliably and in order; UDP sends independent datagrams ([RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.5), [RFC 768](https://www.rfc-editor.org/rfc/rfc768.html)).
- VLANs split one switch into separate broadcast domains; 802.1Q trunks carry several VLANs on one link with a tag ([Cisco: IEEE 802.1Q frame format](https://www.cisco.com/c/en/us/support/docs/lan-switching/8021q/17056-741-4.html)).
- Spanning tree blocks redundant switch paths so frames cannot loop ([Cisco: Rapid Spanning Tree Protocol](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html)).
- Routers forward each packet to the most specific matching route ([RFC 1812](https://www.rfc-editor.org/rfc/rfc1812.html#section-5.2.4.3)).
- OSPF routes inside an organisation by link state; BGP routes between networks by path ([RFC 2328](https://www.rfc-editor.org/rfc/rfc2328.html), [RFC 4271](https://www.rfc-editor.org/rfc/rfc4271.html)).
- IPsec protects traffic between sites or hosts at the IP layer ([NIST SP 800-77 Rev. 1](https://csrc.nist.gov/pubs/sp/800/77/r1/final)).
- Firewalls should deny by default and allow only the traffic a policy requires ([NIST SP 800-41 Rev. 1](https://csrc.nist.gov/pubs/sp/800/41/r1/final)).
- WPA3-Personal gives Wi-Fi networks stronger protection against password guessing ([Wi-Fi Alliance: Security](https://www.wi-fi.org/security)).

## Infrastructure

- Block storage (SAN, iSCSI) presents disks; file storage (NAS, SMB, NFS) presents shared folders ([NIST SP 800-209](https://csrc.nist.gov/pubs/sp/800/209/final), [RFC 7143](https://www.rfc-editor.org/rfc/rfc7143.html)).
- RAID combines disks for redundancy or speed; it is not a backup ([Patterson, Gibson & Katz, 1988: RAID](https://doi.org/10.1145/50202.50214)).
- Keep three copies of important data on two media types with one offsite ([CISA: Data backup options](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf)).
- A hypervisor runs virtual machines either on bare metal or on top of a host operating system ([NIST SP 800-125](https://csrc.nist.gov/pubs/sp/800/125/final)).
- VMware snapshots are not backups and should not be kept for more than 72 hours ([Broadcom KB 318825](https://knowledge.broadcom.com/external/article/318825)).
- Linux services are managed by systemd with `systemctl`, and their logs are read with `journalctl` ([man7: systemctl](https://man7.org/linux/man-pages/man1/systemctl.1.html), [man7: journalctl](https://man7.org/linux/man-pages/man1/journalctl.1.html)).
- Active Directory stores users, computers and groups in domains managed by domain controllers ([Microsoft: AD DS overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)).
- Kerberos authenticates domain logons with tickets, so clocks must stay in sync ([Microsoft: Kerberos authentication overview](https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview)).
- Cloud services come as IaaS, PaaS or SaaS ([NIST SP 800-145](https://csrc.nist.gov/pubs/sp/800/145/final)), and security is shared between provider and customer ([AWS: Shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/)).
- PowerShell pipelines pass objects, not text ([Microsoft: about_Pipelines](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_pipelines)).
- Servers expose out-of-band management through the Redfish REST API ([DMTF: Redfish](https://www.dmtf.org/standards/redfish)).

## Operations and interview

- ITIL 4 organises IT support into practices such as incident management, problem management and change enablement ([PeopleCert: ITIL 4](https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1)).
- Blameless postmortems find the causes of an outage without blaming people ([Google SRE book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/)).
- Infrastructure interviews mix troubleshooting scenarios with behavioural questions, scored against job-related criteria ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
