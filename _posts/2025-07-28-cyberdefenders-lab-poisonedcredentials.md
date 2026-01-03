---
layout: post
title: "CyberDefenders Lab: PoisonedCredentials"
date: 2025-07-28
categories: ["CyberDefenders", "Practice", "SOC Analyst Tier 1", "Level 1"]
tags:
  - "CyberDefenders"
  - "Network Forensics"
  - "Credential Access"
  - "Collection"
  - "Wireshark"
---

# CyberDefenders Lab: PoisonedCredentials

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools Used](#lab-setup-and-tools-used)
  - [Q1: Mistyped Query from 192.168.232.162](#q1-mistyped-query)
  - [Q2: Rogue Machine IP Address](#q2-rogue-machine-ip-address)
  - [Q3: Second Affected Machine](#q3-second-affected-machine)
  - [Q4: Compromised Username](#q4-compromised-username)
  - [Q5: Host Accessed via SMB](#q5-host-accessed-via-smb)
- [What I'd Do Next](#what-id-do-next)
- [Try This Lab Yourself](#try-this-lab-yourself)

# Overview / Goal {#overview--goal}

> Your organization's security team has detected a surge in suspicious network activity. There are concerns that LLMNR (Link-Local Multicast Name Resolution) and NBT-NS (NetBIOS Name Service) poisoning attacks may be occurring within your network. These attacks are known for exploiting these protocols to intercept network traffic and potentially compromise user credentials. Your task is to investigate the network logs and examine captured network traffic.

The lab scenario is based on an attacker exploiting **LLMNR and NBT-NS poisoning**.

Okay, at first I didn't even know what is LLMNR or NBT-NS... Nothing a bit of research skills can't fix though! I looked it up and:

- **LLMNR** = Link-Local Multicast Name Resolution. fallback DNS when DNS fails. noisy, insecure, broadcast-based.
- **NBT-NS** = NetBIOS Name Service. same vibe but older. Windows uses it when they can't resolve names.

This tells me the attack is very old school but I guess still viable in sloppy networks? From my research on the topic, I get that attackers love those because ANY host on the subnet can reply. Creds are sent in NTLM challenge/response, the attacker fakes being the server and snatches the NTLMv2 hashes. If creds are caught, we should see NTLMv2 auth blobs in SMB/HTTP after poisoned resolution. Once hackers steal the hashes they can try to crack it offline or possibly relay it?

# Lab Setup and Tools Used {#lab-setup-and-tools-used}

Artifact provided: a PCAP file with suspicious network traffic.

Tools used:

- **Wireshark**: to filter around the PCAP file
- Some detective 🕵️‍♂️ work in sorting packets by time to follow the attacker's steps

---

## Q1: Mistyped Query from 192.168.232.162 {#q1-mistyped-query}

I filtered on:

```sql
ip.src == 192.168.232.162 && (udp.port == 5355 || udp.port == 137)
```

This shows the queries sent by that host, and this narrows down to LLMNR (5355) and NBT-NS (137) queries from that host.
I'm looking in the info column for something that sounds off...
Fount it! The one that stands out is:

**Answer:** `fileshaare` ✅

---

## Q2: Rogue Machine IP Address {#q2-rogue-machine-ip-address}

To see who's responding to the fake queries, I filtered on:

```sql
udp.port == 137 || udp.port == 5355
```

The rogue consistently responded with poisoned replies:

**Answer:** `192.168.232.215` ✅

---

## Q3: Second Affected Machine {#q3-second-affected-machine}

Tracked outbound traffic from the rogue with:

```sql
ip.src == 192.168.232.215
```

I sorted by Time column and the first victim was "192.168.232.162" as expected, but then the second one receiving poisoned responses was:

**Answer:** `192.168.232.176` ✅

---

## Q4: Compromised Username {#q4-compromised-username}

After the poisoned resolution, victims try to authenticate and their NTLM data leaks. So, I filtered with:

```sql
ntlmssp
```

The filter revealed the NTLM negotiation, including the username in the **Info** Column:

**Answer:** `janesmith` ✅

---

## Q5: Host Accessed via SMB {#q5-host-accessed-via-smb}

Looking for SMB traffic to the rogue machine:

```sql
smb2 && ip.dst == 192.168.232.215
```

To be honest this one was a bit new to me, but after some research, I found SMB2 Session Setup Response with Target Info containing the DNS computer name:

```plaintext
AccountingPC.cybercactus.local
```

**Answer:** `ACCOUNTINGPC` ✅

---

# What I'd Do Next (Blue Team) {#what-id-do-next}

- Add a Group Policy to disable **LLMNR and NBT-NS** !!!
- Enforce SMB signing to prevent relay.

# Try This Lab Yourself {#try-this-lab-yourself}

🔗 Lab Link: [CyberDefenders: PoisonedCredentials](https://cyberdefenders.org/blueteam-ctf-challenges/poisonedcredentials/)
