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

# CyberDefenders Lab: Oski

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools Used](#lab-setup-and-tools-used)
  - [Q1: Malware Creation Time](#q1-malware-creation-time)
  - [Q2: C2 Server Contacted](#q2-c2-server-contacted)
  - [Q3: First Library Requested](#q3-first-library-requested)
  - [Q4: RC4 Key Used](#q4-rc4-key-used)
  - [Q5: MITRE Technique for Password Theft](#q5-mitre-technique-for-password-theft)
  - [Q6: DLL Deletion Directory](#q6-dll-deletion-directory)
  - [Q7: Malware Self-Delete Time](#q7-malware-self-delete-time)
- [What I'd Do Next (Blue Team)](#what-id-do-next)
- [Refining the Attack (Red Team)](#refining-the-attack)
- [Try This Lab Yourself](#try-this-lab-yourself)

# Overview / Goal

> The accountant at the company received an email titled "Urgent New Order" from a client late in the afternoon. When he attempted to access the attached invoice, he discovered it contained false order information. Subsequently, the SIEM solution generated an alert regarding downloading a potentially malicious file. Upon initial investigation, it was found that the PPT file might be responsible for this download. Could you please conduct a detailed examination of this file?

The accountant was clearly tired in the late afternoon after a heavy lunch and didn't think carefully before clicking the attached invoice 🥱.

The goal: Run threat intel lookups and sandbox analysis to figure out what this file does, who it talks to, and how it behaves.

# Lab Setup and Tools Used

Artifacts provided: the MD5 hash of the suspicious file:

```plaintext
12c1842c3ccafe7408c23ebf292ee3d9

```

Tools available:

- **VirusTotal**
- **Any.run**

---

## Q1: Malware Creation Time {#q1-malware-creation-time}

In VirusTotal, under the **Details -> History** section, we can see metadata about compilation and submission. Creation time:

**Answer:** `2022-09-28 17:40` ✅

---

## Q2: C2 Server Contacted {#q2-c2-server-contacted}

Again in VirusTotal, I checked the **Network Activity -> Contacted URLs**. Found this outbound connection:

```plaintext
http://171.22.28.221/5c06c05b7b34e8e6.php

```

That's the **C2 callback** endpoint.

**Answer:** `171.22.28.221` ✅

---

## Q3: First Library Requested {#q3-first-library-requested}

Again, **VirusTotal -> Behaviour -> Files Dropped**, the malware's first request shows up. It loads `sqlite3.dll` early on, which suggests i'm about to see credential/database related actions soon 🤔.

**Answer:** `sqlite3.dll` ✅

---

## Q4: RC4 Key Used {#q4-rc4-key-used}

In **Any.run**, checked the **Malware Configuration** tab. The config dump revealed the hardcoded RC4 key:

```plaintext
5329514621441247975720749009
```

This is used for decrypting its base64-encoded strings.

**Answer:** `5329514621441247975720749009` ✅

---

## Q5: MITRE Technique for Password Theft {#q5-mitre-technique-for-password-theft}

In **Any.run -> MITRE ATT&CK tab**, the sandbox mapped 5 tactics and 10 techniques. The one tied to credential access was:

```plaintext
T1555 - Credentials from Password Stores
```

It was triggered by the malware's using `VPN.exe` to grab stored credentials.

**Answer:** `T1555` ✅

---

## Q6: DLL Deletion Directory {#q6-dll-deletion-directory--}

Looking at the **Process Tree** in Any.run, I saw a child process executing this command:

```bash
"C:\Windows\system32\cmd.exe" /c timeout /t 5 & del /f /q "C:\Users\admin\AppData\Local\Temp\VPN.exe" & del "C:\ProgramData\*.dll" & exit
```

### What it does:

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

## Q7: Malware Self-Delete Time {#q7-malware-self-delete-time}

Same process tree reveals a **timeout** before self-deletion:

```sql
timeout /t 5
```

So the malware deletes itself **5 seconds** after finishing exfiltration.

**Answer:** `5` ✅

---

# What I'd Do Next (Blue Team) {#what-id-do-next}

- The absolute best and first layer of defence is to train staff to spot social engineering attacks.
- Considering email security tools that block suspicious emails/links/files would benefit a lot.
- Block the execution of sqlite3.dll from unexpected directories like "Temp" or "ProgramData" since proper apps don't tend to side-load it from there.
- Add the C2 IP to the network blocklist and look around for any logs of other workstations making similar `.php` callbacks.
- Assume all credentials are compromised (Including cookies), and implement Conditional Access policies that require re-auth for suspicious/new locations.
- Search for leaks related to the company and its employees on dark markets

# Refining the Attack (Red Team) {#refining-the-attack}

- I'd make it harder to decrypt in a generic sandbox since Any.run had no issue with it.
- Instead of dropping a suspicious exe I'd attempt to execute the cerds stealing with an in-memory solution or a powershell script or possible dll injection to avoid leaving a file that I'll have to delete later.
- Instead of a PPT file maybe I'd use a Password Protected ZIP to avoid email scanners since they can't peek in an encrypted file.

# Try This Lab Yourself

🔗 Lab Link: [CyberDefenders: Oski Lab](https://cyberdefenders.org/blueteam-ctf-challenges/oski/)
