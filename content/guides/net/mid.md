# Network & Connectivity — mid level

*The bootcamp is written for associate roles. This is what a mid-level network or infrastructure engineer adds: routing design, redundancy, segmentation and access control, automation and monitoring, and highly available virtualisation and identity.*

## Routing design

- OSPF splits a network into areas around a backbone area 0 to limit how far topology changes spread ([RFC 2328](https://www.rfc-editor.org/rfc/rfc2328.html)).
- BGP chooses among routes in a fixed decision process, using attributes such as local preference and AS path length ([RFC 4271](https://www.rfc-editor.org/rfc/rfc4271.html#section-9.1)).
- BGP peers talk over TCP port 179 ([RFC 4271](https://www.rfc-editor.org/rfc/rfc4271.html)).
- Path MTU discovery finds the largest packet a path carries; blocked ICMP breaks it ([RFC 1191](https://www.rfc-editor.org/rfc/rfc1191.html), [RFC 8201](https://www.rfc-editor.org/rfc/rfc8201.html)).

## Redundancy

- VRRP lets several routers share a virtual gateway address, so hosts keep their default gateway when one router fails ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.html)).
- Bond server links in active-backup or LACP mode so one cable or switch can fail ([Linux kernel: Bonding](https://www.kernel.org/doc/html/latest/networking/bonding.html)).
- vSphere HA restarts virtual machines on surviving hosts after a host fails ([Broadcom: vSphere HA provides rapid recovery from outages](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0/vsphere-availability/business-continuity-and-minimizing-downtime/vmware-ha-provides-rapid-recovery-from-outages.html)).
- DRS balances load across a cluster by placing and migrating virtual machines ([Broadcom: Creating a DRS cluster](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0/vsphere-resource-management/creating-a-drs-cluster.html)).
- RAID 6 keeps two sets of parity, so data survives two disk failures ([SNIA: Common RAID Disk Data Format](https://www.snia.org/tech_activities/standards/curr_standards/ddf)).
- A contingency plan sets RTO and RPO per system and tests recovery ([NIST SP 800-34 Rev. 1](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)).

## Quality of service

- DiffServ marks packets with a 6-bit DSCP value that routers use to queue them ([RFC 2474](https://www.rfc-editor.org/rfc/rfc2474.html)).
- Expedited Forwarding gives voice-like traffic low delay and jitter ([RFC 3246](https://www.rfc-editor.org/rfc/rfc3246.html)).
- RFC 4594 recommends service classes and markings for common traffic types ([RFC 4594](https://www.rfc-editor.org/rfc/rfc4594.html)).

## Segmentation and access control

- 802.1X makes a device authenticate before its switch port or Wi-Fi association opens, usually against RADIUS ([RFC 3580](https://www.rfc-editor.org/rfc/rfc3580.html), [RFC 2865](https://www.rfc-editor.org/rfc/rfc2865.html)).
- TACACS+ separates authentication, authorisation and accounting and obfuscates the whole packet body, which suits device administration ([RFC 8907](https://www.rfc-editor.org/rfc/rfc8907.html)).
- Zero trust grants access per request based on identity and device state rather than network location ([NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)).
- Conditional Access applies sign-in policies such as requiring MFA or a compliant device ([Microsoft: Conditional Access overview](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)).
- Site-to-site VPNs use IPsec, with IKEv2 to negotiate keys ([RFC 4301](https://www.rfc-editor.org/rfc/rfc4301.html), [RFC 7296](https://www.rfc-editor.org/rfc/rfc7296.html)).

## Automation and monitoring

- NETCONF configures devices with structured data and YANG models instead of screen-scraped CLI ([RFC 6241](https://www.rfc-editor.org/rfc/rfc6241.html), [RFC 7950](https://www.rfc-editor.org/rfc/rfc7950.html)).
- Ansible pushes repeatable configuration to network devices ([Ansible: Network getting started](https://docs.ansible.com/projects/ansible/latest/network/getting_started/index.html)).
- Make scripts stop on errors with `set -e`, `set -u` and `pipefail` ([Bash manual: The Set builtin](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html)).
- Use SNMPv3 for authentication and encryption of monitoring traffic ([RFC 3414](https://www.rfc-editor.org/rfc/rfc3414.html)).
- IPFIX exports flow records that show who talks to whom ([RFC 7011](https://www.rfc-editor.org/rfc/rfc7011.html)).
- Alert on the four golden signals: latency, traffic, errors and saturation ([Google SRE book: Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)).

## Identity infrastructure

- AD sites map the physical network so replication and logons use nearby domain controllers ([Microsoft: Understanding AD site topology](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/understanding-active-directory-site-topology)).
- Five FSMO roles run on single domain controllers; know where they are before decommissioning one ([Microsoft: FSMO roles](https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/fsmo-roles)).
- Manage Linux storage with LVM so volumes can grow without repartitioning ([man7: lvm](https://man7.org/linux/man-pages/man8/lvm.8.html)).

## Operations

- Analyse, test, approve and record configuration changes, with a way back ([NIST SP 800-128](https://csrc.nist.gov/pubs/sp/800/128/upd1/final)).
- NIST now frames incident response with the CSF 2.0 functions: govern, identify and protect to prepare, then detect, respond and recover ([NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)).
- Write blameless postmortems with root causes and follow-up actions ([Google SRE book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/)).
- DNS-based load balancing spreads users across sites, but cached answers slow failover ([Google SRE book: Load balancing at the frontend](https://sre.google/sre-book/load-balancing-frontend/)).
