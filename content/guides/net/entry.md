# Network & Connectivity — entry level

*What an associate network, infrastructure or support role (0–3 years) expects: addressing, core protocols, switching and routing basics, troubleshooting, and day-to-day work on storage, virtual machines, Linux, Windows and Active Directory.*

## Addressing

- A prefix length sets the network part of an address: a /24 leaves 8 host bits, 256 addresses and 254 usable hosts ([RFC 4632](https://www.rfc-editor.org/rfc/rfc4632.html), [RFC 791](https://www.rfc-editor.org/rfc/rfc791.html)).
- A /31 can number a point-to-point link because it needs no broadcast address ([RFC 3021](https://www.rfc-editor.org/rfc/rfc3021.html)).
- A 169.254.x.x address means the host got no DHCP lease and configured a link-local address itself ([RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html)).
- 100.64.0.0/10 is shared address space used by carrier-grade NAT ([RFC 6598](https://www.rfc-editor.org/rfc/rfc6598.html)).
- MAC addresses are 48-bit identifiers assigned to network interfaces ([RFC 7042](https://www.rfc-editor.org/rfc/rfc7042.html)).
- IPv6 hosts can configure their own addresses from router advertisements (SLAAC) ([RFC 4862](https://www.rfc-editor.org/rfc/rfc4862.html)).

## Core protocols

- DHCP clients broadcast a discover, take an offer, request it and receive an acknowledgement ([RFC 2131](https://www.rfc-editor.org/rfc/rfc2131.html#section-3.1)).
- DNS answers are cached for the record's TTL, so changes take time to reach everyone ([RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html)).
- DNS uses UDP port 53 and also TCP, for example for large responses ([RFC 7766](https://www.rfc-editor.org/rfc/rfc7766.html)).
- Well-known ports are registered with IANA: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS, 3389 RDP ([IANA: Service name and port number registry](https://www.iana.org/assignments/service-names-port-numbers)).
- TLS 1.3 encrypts and authenticates traffic such as HTTPS ([RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html)).
- NTP keeps clocks in sync across a network ([RFC 5905](https://www.rfc-editor.org/rfc/rfc5905.html)).
- Syslog messages carry a severity from 0 (emergency) to 7 (debug) ([RFC 5424](https://www.rfc-editor.org/rfc/rfc5424.html#section-6.2.1)).

## Switching and routing

- An 802.1Q trunk inserts a 4-byte tag naming the frame's VLAN, up to 4096 VLANs; frames on the native VLAN cross untagged ([Cisco: IEEE 802.1Q frame format](https://www.cisco.com/c/en/us/support/docs/lan-switching/8021q/17056-741-4.html)).
- Rapid spanning tree converges far faster than the original protocol after a link change ([Cisco: Rapid Spanning Tree Protocol](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html)).
- Link aggregation (802.3ad / LACP) bundles several links into one for bandwidth and redundancy ([Linux kernel: Bonding](https://www.kernel.org/doc/html/latest/networking/bonding.html)).
- When two sources offer the same route, the router prefers the one with the lower administrative distance ([Cisco: Route selection and administrative distance](https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html)).
- Routers choose the longest matching prefix, so a /24 route wins over a /16 ([RFC 1812](https://www.rfc-editor.org/rfc/rfc1812.html#section-5.2.4.3)).

## Troubleshooting

- Check the interface and address first with `ipconfig` or `ip addr` ([Microsoft: ipconfig](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig), [man7: ip](https://man7.org/linux/man-pages/man8/ip.8.html)).
- Ping sends ICMP echo requests; a reply proves IP reachability, not that a service works ([RFC 792](https://www.rfc-editor.org/rfc/rfc792.html)).
- `tracert` raises the TTL hop by hop to show the path a packet takes ([Microsoft: tracert](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert)).
- Test name resolution separately with `nslookup` ([Microsoft: nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup)).
- Test the port itself with `Test-NetConnection -Port`, or list listening sockets with `ss` ([Microsoft: Test-NetConnection](https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection), [man7: ss](https://man7.org/linux/man-pages/man8/ss.8.html)).

## Security

- Allow only required traffic and deny the rest ([NIST SP 800-41 Rev. 1](https://csrc.nist.gov/pubs/sp/800/41/r1/final)).
- Use multi-factor authentication for remote and administrative access ([NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html)).
- Use SSH keys rather than passwords for server logins ([OpenBSD: ssh-keygen](https://man.openbsd.org/ssh-keygen)).
- In AWS, security groups are stateful and network ACLs are stateless ([AWS: Security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html), [AWS: Network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)).

## Storage and virtualisation

- iSCSI carries SCSI block commands over TCP/IP ([RFC 7143](https://www.rfc-editor.org/rfc/rfc7143.html)).
- SMB is the Windows file-sharing protocol ([Microsoft: SMB overview](https://learn.microsoft.com/en-us/windows-server/storage/file-server/file-server-smb-overview)); NFS is the common Unix one ([RFC 8881](https://www.rfc-editor.org/rfc/rfc8881.html)).
- RAID 1 mirrors disks; RAID 5 spreads parity so one disk can fail ([Patterson, Gibson & Katz, 1988: RAID](https://doi.org/10.1145/50202.50214)).
- Recovery time objective (RTO) is how long a system may be down; recovery point objective (RPO) is how much data may be lost ([NIST SP 800-34 Rev. 1](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)).
- Delete snapshots after use: they are not backups, and long chains hurt performance ([Broadcom KB 318825](https://knowledge.broadcom.com/external/article/318825)).
- vMotion moves a powered-on VM to another host, for example to free a host for maintenance ([Broadcom: Migrating virtual machines](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0/vcenter-and-host-management/migrating-virtual-machines.html)).

## Linux

- Standard directories have fixed roles: `/etc` for configuration, `/var` for logs and changing data ([Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)).
- `chmod` sets read, write and execute permissions for owner, group and others ([man7: chmod](https://man7.org/linux/man-pages/man1/chmod.1.html)).
- `sudo` runs a single command as another user, usually root, and logs it ([sudo manual](https://www.sudo.ws/docs/man/sudo.man/)).
- `/etc/fstab` lists the filesystems mounted at boot ([man7: fstab](https://man7.org/linux/man-pages/man5/fstab.5.html)).

## Windows and Active Directory

- Domain controllers register SRV records in DNS, and clients find them by querying DNS, so broken DNS breaks domain logons ([Microsoft: DC locator](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/dc-locator)).
- Group Policy applies local, then site, then domain, then OU policies; the last applied wins ([Microsoft: Group Policy hierarchy](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/policy/group-policy-hierarchy)).
- Kerberos rejects logons when clocks differ by more than the allowed skew, 5 minutes by default ([Microsoft: Maximum tolerance for computer clock synchronization](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/maximum-tolerance-for-computer-clock-synchronization)).
- Microsoft Entra ID is the cloud identity service used for Microsoft 365 and Azure sign-ins ([Microsoft: What is Microsoft Entra?](https://learn.microsoft.com/en-us/entra/fundamentals/what-is-entra)).

## Scripting and operations

- Scripts signal success with exit status 0 ([Bash manual: Exit status](https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html)).
- The PowerShell execution policy is not a security boundary ([Microsoft: about_Execution_Policies](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies)).
- ITIL separates incident management (restore service) from problem management (remove the cause) ([PeopleCert: ITIL 4](https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1)).
