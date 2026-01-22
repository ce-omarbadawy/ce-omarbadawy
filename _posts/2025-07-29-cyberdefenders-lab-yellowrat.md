---
layout: post
title: "CyberDefenders Lab: Yellow RAT"
date: 2025-07-29
categories: ["CyberDefenders", "Practice", "SOC Analyst Tier 1", "Level 1"]
tags:
  - "CyberDefenders"
  - "Treat Intel"
  - "VirusTotal"
---

# CyberDefenders Lab: Yellow RAT

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools Used](#lab-setup-and-tools-used)
- [Investigation Walkthrough](#investigation-walkthrough)
  - [Q1: Malware Family](#q1-malware-family)
  - [Q2: Common Filename](#q2-common-filename)
  - [Q3: Compilation Timestamp](#q3-compilation-timestamp)
  - [Q4: First Submission to VirusTotal](#q4-first-submission-to-virustotal)
  - [Q5: Dropped .dat File](#q5-dropped-dat-file)
  - [Q6: C2 Server](#q6-c2-server)
- [What I'd Do Next (Blue Team)](#what-id-do-next)
- [Refining the Attack (Red Team)](#refining-the-attack)
- [Try This Lab Yourself](#try-this-lab-yourself)

# Overview / Goal {#overview--goal}

> During a regular IT security check at GlobalTech Industries, abnormal network traffic was detected from multiple workstations. Upon initial investigation, it was discovered that certain employees' search queries were being redirected to unfamiliar websites. This discovery raised concerns and prompted a more thorough investigation. Your task is to investigate this incident and gather as much information as possible.

That's usually a big red flag 😬.

So, the goal here is to figure out what malware is involved and how it operates.

# Lab Setup and Tools Used {#lab-setup-and-tools-used}

Artifact provided: a malware hash.

```plaintext
30E527E45F50D2BA82865C5679A6FA998EE0A1755361AB01673950810D071C85
```

Tools used:

- **VirusTotal**: primary platform for static analysis and community intel
- **Hybrid-Analysis**: used as a secondary source when VirusTotal didn't expose all details

---

## Q1: Malware Family {#q1-malware-family}

**Initial Analysis**

The first thing I did was drop the hash into VirusTotal.

Immediate result: **58 detections**. Not subtle at all.

The most common label I saw was:

```plaintext
trojan.msil/polazert
```

Breaking that down quickly:

- **Trojan**: masquerades as something legitimate and performs unwanted actions
- **MSIL**: Microsoft Intermediate Language -> .NET malware
- **Polazert**: vendor-specific family name (varies between AV engines)

Given the lab name already mentions a RAT, this lines up with expectations.

Understanding the adversary helps with proper defence and detection.

From the **Community** tab on VirusTotal, multiple analysts were referring to this malware as:

**Answer:** `Yellow Cockatoo RAT` ✅

---

## Q2: Common Filename {#q2-common-filename}

Knowing filenames helps with hunting across endpoints.

In the **Details** tab on VirusTotal, the most common filename associated with the malware was:

**Answer:** `111bc461-1ca8-43c6-97ed-911e0e69fdf8.dll` ✅

---

## Q3: Compilation Timestamp {#q3-compilation-timestamp}

Compilation timestamps can hint at development timelines or reuse.

In the same **Details** tab, under creation time, I found:

**Answer:** `2020-09-24 18:26` ✅

---

## Q4: First Submission to VirusTotal {#q4-first-submission-to-virustotal}

This helps estimate how long the malware may have existed in the wild.

Again from the **Details** tab:

**Answer:** `2020-10-15 02:47` ✅

---

## Q5: Dropped .dat File {#q5-dropped-dat-file}

This one wasn't obvious on VirusTotal.

I didn't want to just Google the answer, so I switched to **Hybrid-Analysis** for a second opinion. After searching the sample and checking the **Interesting** section, I found a dropped file path pointing to AppData:

```plaintext
\AppData\Roaming\solarmarker.dat
```

**Answer:** `solarmarker.dat` ✅

---

## Q6: C2 Server {#q6-c2-server}

Identifying command-and-control infrastructure is critical for containment.

In the **behaviour** tab on VirusTotal, under **Network Communication**, I spotted a memory pattern URL:

**Answer:** `https://gogohid.com` ✅

---

# What I'd Do Next (Blue Team) {#what-id-do-next}

- Train staff to spot social engineering attacks.
- Block the identified C2 domain at the network level.
- Hunt for `.dat` files across `%AppData%`.
- Make sure Script Block Logging is enabled to catch "de-obfuscated" code as it executes
- Audit web browsers to check fo modified preferences.

# Refining the Attack (Red Team) {#refining-the-attack}

- Map the malicious code to a legitimate process's memory.
- Add environmental checks for virtual machines for the malware to sleep or delete itself instead of reaching out to C2.
- Encrypt stolen data before sending it over.

# Try This Lab Yourself {#try-this-lab-yourself}

Lab Link: [https://cyberdefenders.org/blueteam-ctf-challenges/yellow-rat/](https://cyberdefenders.org/blueteam-ctf-challenges/yellow-rat/){:target="\_blank"}
