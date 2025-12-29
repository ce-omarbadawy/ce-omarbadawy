---
layout: post
title: "CyberDefenders Lab: Yellow RAT"
date: 2025-08-26
categories: ["CyberDefenders", "Practice", "SOC Analyst Tier 1", "Level 1"]
tags: ["CyberDefenders", "Treat Intel", "VirusTotal"]
---

## Yellow RAT Lab at CyberDefenders

## Table of Contents

- [Overview](#overview)
- [Lab Setup and Tools Used](#lab-setup-and-tools-used)
- [Investigation Walkthrough](#investigation-walkthrough)
  - [Q1: Malware Family](#q1-malware-family)
  - [Q2: Common Filename](#q2-common-filename)
  - [Q3: Compilation Timestamp](#q3-compilation-timestamp)
  - [Q4: First Submission to VirusTotal](#q4-first-submission-to-virustotal)
  - [Q5: Dropped .dat File](#q5-dropped-dat-file)
  - [Q6: C2 Server](#q6-c2-server)
- [Key Takeaways](#key-takeaways)
- [What I'd Do Next](#what-id-do-next)
- [Try This Lab Yourself](#try-this-lab-yourself)

---

## Overview

This lab focuses on analysing a malware sample using **threat intelligence platforms**, mainly VirusTotal, to identify indicators of compromise, understand malware behaviour, and answer incident response questions.

The scenario simulates a real SOC-style investigation where abnormal network traffic and browser redirections were detected across multiple employee workstations at GlobalTech Industries. That's usually a big red flag, so the goal here is to figure out _what_ malware is involved and _how_ it operates.

---

## Lab Setup and Tools Used

Artifact provided: a ZIP file containing the malware sample.

Key artifact extracted: a malware hash.

Tools used:

- **VirusTotal**: primary platform for static analysis and community intel
- **Hybrid-Analysis**: used as a secondary source when VirusTotal didn't expose all details

Malware hash analysed:

```
30E527E45F50D2BA82865C5679A6FA998EE0A1755361AB01673950810D071C85
```

---

## Investigation Walkthrough

### Initial Analysis

The first thing I did was drop the hash into VirusTotal.

Immediate result: **58 detections**. Not subtle at all.

The most common label I saw was:

```
trojan.msil/polazert
```

Breaking that down quickly:

- **Trojan**: masquerades as something legitimate and performs unwanted actions
- **MSIL**: Microsoft Intermediate Language → .NET malware
- **Polazert**: vendor-specific family name (varies between AV engines)

Given the lab name already mentions a RAT, this lines up with expectations.

---

### Q1: Malware Family {#q1-malware-family}

Understanding the adversary helps with proper defence and detection.

From the **Community** tab on VirusTotal, multiple analysts were referring to this malware as:

**Answer:** `Yellow Cockatoo RAT` ✅

---

### Q2: Common Filename {#q2-common-filename}

Knowing filenames helps with hunting across endpoints.

In the **Details** tab on VirusTotal, the most common filename associated with the malware was:

**Answer:** `111bc461-1ca8-43c6-97ed-911e0e69fdf8.dll` ✅

---

### Q3: Compilation Timestamp {#q3-compilation-timestamp}

Compilation timestamps can hint at development timelines or reuse.

In the same **Details** tab, under creation time, I found:

**Answer:** `2020-09-24 18:26` ✅

---

### Q4: First Submission to VirusTotal {#q4-first-submission-to-virustotal}

This helps estimate how long the malware may have existed in the wild.

Again from the **Details** tab:

**Answer:** `2020-10-15 02:47` ✅

---

### Q5: Dropped .dat File {#q5-dropped-dat-file}

This one wasn't obvious on VirusTotal.

I didn't want to just Google the answer, so I switched to **Hybrid-Analysis** for a second opinion. After searching the sample and checking the **Interesting** section, I found a dropped file path pointing to AppData:

```
\AppData\Roaming\solarmarker.dat
```

**Answer:** `solarmarker.dat` ✅

---

### Q6: C2 Server {#q6-c2-server}

Identifying command-and-control infrastructure is critical for containment.

In the **behaviour** tab on VirusTotal, under **Network Communication**, I spotted a memory pattern URL:

**Answer:** `https://gogohid.com` ✅

---

## Key Takeaways

- VirusTotal alone can answer most incident response questions if you dig deep enough.
- Community intel is surprisingly useful when labels differ across AV engines.
- Using multiple threat intel platforms fills in gaps when one source is incomplete.

---

## What I'd Do Next

If this were a real environment:

- Block the identified C2 domain at the network level.
- Hunt for the known filename and dropped `.dat` file across endpoints.
- Add detections for MSIL RAT behaviour and abnormal browser redirections.
- Reimage affected systems if persistence is suspected.

---

## Try This Lab Yourself

Lab Link: [https://cyberdefenders.org/blueteam-ctf-challenges/yellow-rat/](https://cyberdefenders.org/blueteam-ctf-challenges/yellow-rat/)
"""
