---
layout: post
title: "CyberDefenders Lab: Oski"
date: 2025-07-27
categories: ["CyberDefenders", "Practice", "SOC Analyst Tier 1", "Level 1"]
tags:
  - "CyberDefenders"
  - "Threat Intel"
  - "Initial Access"
  - "Execution"
  - "Defence Evasion"
  - "Credential Access"
  - "Command and Control"
  - "Exfiltration"
  - "VirusTotal"
  - "Any.run"
---

## Second Lab: Oski Malware at CyberDefenders

## Table of Contents

- [First Impressions](#first-impressions)
- [Lab Setup and Tools Used](#lab-setup-and-tools-used)
  - [Q1: Malware Creation Time](#q1-malware-creation-time)
  - [Q2: C2 Server Contacted](#q2-c2-server-contacted)
  - [Q3: First Library Requested](#q3-first-library-requested)
  - [Q4: RC4 Key Used](#q4-rc4-key-used)
  - [Q5: MITRE Technique for Password Theft](#q5-mitre-technique-for-password-theft)
  - [Q6: DLL Deletion Directory](#q6-dll-deletion-directory)
  - [Q7: Malware Self-Delete Time](#q7-malware-self-delete-time)
- [Key Takeaways](#key-takeaways)
- [What I'd Do Next](#what-id-do-next)
- [Try This Lab Yourself](#try-this-lab-yourself)

---

## First Impressions

This lab scenario is based on a **Phishing with malicious attachment** an accountant received to their company email titled `Urgent New Order`. The accountant was clearly tired in the late afternoon after a heavy lunch and didn't think carefully before clicking the attached invoice 🥱. Luckily the SIEM solution used generated an alert about a potentially malicious file being downloaded. A shady `.ppt` file.

The mission: Run threat intel lookups and sandbox analysis to figure out what this file does, who it talks to, and how it behaves.

---

## Lab Setup and Tools Used

Artifacts provided: the MD5 hash of the suspicious file:

```txt
12c1842c3ccafe7408c23ebf292ee3d9

```

Tools available:

- **VirusTotal**
- **Any.run**

---

### Q1: Malware Creation Time {#q1-malware-creation-time}

In VirusTotal, under the **Details -> History** section, we can see metadata about compilation and submission. Creation time:

**Answer:** `2022-09-28 17:40` ✅

---

### Q2: C2 Server Contacted {#q2-c2-server-contacted}

Again in VirusTotal, I checked the **Network Activity -> Contacted URLs**. Found this outbound connection:

```txt
http://171.22.28.221/5c06c05b7b34e8e6.php

```

That's the **C2 callback** endpoint.

**Answer:** `171.22.28.221` ✅

---

### Q3: First Library Requested {#q3-first-library-requested}

Again, **VirusTotal -> Behaviour -> Files Dropped**, the malware's first request shows up. It loads `sqlite3.dll` early on, which suggests i'm about to see credential/database related actions soon 🤔.

**Answer:** `sqlite3.dll` ✅

---

### Q4: RC4 Key Used {#q4-rc4-key-used}

In **Any.run**, checked the **Malware Configuration** tab. The config dump revealed the hardcoded RC4 key:

```txt
5329514621441247975720749009
```

This is used for decrypting its base64-encoded strings.

**Answer:** `5329514621441247975720749009` ✅

---

### Q5: MITRE Technique for Password Theft {#q5-mitre-technique-for-password-theft}

In **Any.run -> MITRE ATT&CK tab**, the sandbox mapped 5 tactics and 10 techniques. The one tied to credential access was:

```txt
T1555 - Credentials from Password Stores
```

It was triggered by the malware's using `VPN.exe` to grab stored credentials.

**Answer:** `T1555` ✅

---

### Q6: DLL Deletion Directory {#q6-dll-deletion-directory--}

Looking at the **Process Tree** in Any.run, I saw a child process executing this command:

```bash
"C:\Windows\system32\cmd.exe" /c timeout /t 5 & del /f /q "C:\Users\admin\AppData\Local\Temp\VPN.exe" & del "C:\ProgramData\*.dll" & exit
```

#### What it does:

- `cmd.exe /c` -> uses command prompt to run the following commands, then terminate.
- `timeout /t 5` -> wait 5 seconds.
- `&` -> command separator.
- `del /f /q "C:\Users\admin\AppData\Local\Temp\VPN.exe"`

  - `/f` = force deletion
  - `/q` = quiet mode
  - deletes the dropped malware (`VPN.exe`).

- `& del "C:\ProgramData\*.dll"` -> deletes **all DLL files** in "C:\ProgramData". That's just nasty 😒... It's both anti-forensic (cover tracks) and potentially very disruptive. If you're going to be an evil hacker at least have some class about it...
  > SIDE NOTE: I do NOT endorse un-ethical hacking.
- `& exit` -> close the cmd session.

**Answer:** `C:\ProgramData` ✅

---

### Q7: Malware Self-Delete Time {#q7-malware-self-delete-time}

Same process tree reveals a **timeout** before self-deletion:

```sql
timeout /t 5
```

So the malware deletes itself **5 seconds** after finishing exfiltration.

**Answer:** `5` ✅

---

## Key Takeaways

- Attack vector was a **malicious PPT**. Many still fall for fake invoices.
- Malware had hardcoded command-and-control server IP address and **RC4 key**.
- Primary credential theft tactic: **T1555 (Credentials from Password Stores)**.
- Post-exfiltration clean-up included **DLLs deletion** in ProgramData and **self-delete in 5 seconds**.
- A very common info stealer.

---

## What I'd Do Next

- Infostealers are usually distributed by phishing. The absolute best defence is to train staff to spot social engineering attacks
- Make sure that corporate system passwords are not accessible through personal devices
- Considering email security tools that block suspicious emails/links/files would benefit a lot
- Add rules and signature-based detections for suspicious activity
- Multi-factor Authentication can still be bypassed if session cookies are stolen, but it's still very important to use to prevent login credentials being used.
- Search for leaks related to the company and its employees on dark markets
- Monitor for outbound traffic
- Look for PowerShell or CMD self-deletion patterns like `timeout & del`
- Flag unexpected `.ppt` files making outbound HTTP requests

---

## Try This Lab Yourself

🔗 Lab Link: [CyberDefenders: Oski Lab](https://cyberdefenders.org/blueteam-ctf-challenges/oski/)
