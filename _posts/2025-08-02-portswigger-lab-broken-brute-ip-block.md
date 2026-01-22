---
layout: post
title: "PortSwigger Lab: Broken Brute-Force Protection, IP Block"
date: 2025-08-02
categories:
  [
    "PortSwigger",
    "Authentication Vulnerabilities",
    "Vulnerabilities in password-based login",
  ]
tags:
  - "PortSwigger"
  - "Authentication Vulnerabilities"
  - "Vulnerabilities in password-based login"
  - "IP Block"
  - "Brute-Force"
  - "Turbo Intruder"
  - "Burp Suite"
---

# PortSwigger Lab: Broken Brute-Force Protection, IP Block

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools](#lab-setup-and-tools)
- [What's the password?](#whats-the-login-info)
  - [Solution Steps](#solution)
- [What I'd Do Next (Blue Team)](#what-id-do-next)
- [Try This Lab Yourself](#try-this-lab-yourself)

# Overview / Goal {#overview--goal}

"This lab is vulnerable due to a logic flaw in its password brute-force protection. To solve the lab, brute-force the victim's password, then log in and access their account page."

**Your credentials:** `wiener:peter`
**Victim's username:** `carlos`

Wordlist provided by PortSwigger:

- https://portswigger.net/web-security/authentication/auth-lab-passwords

This lab introduces IP-based brute-force protection. After too many failed attempts, the IP gets temporarily blocked. The challenge is to find the logic flaw that allows bypassing this protection.

# Lab Setup and Tools {#lab-setup-and-tools-used}

- Burp Suite + Firefox (through FoxyProxy)
- Turbo Intruder extension

---

# What's the Password? {#whats-the-login-info}

## Solution Steps {#solution}

**1) Initial Reconnaissance**

I started by inputting a fake username and password `FAKE:FAKE` and sent the Request.
I got "Invalid username". But, when I tried `wiener:FAKE` and I got "Incorrect password"

The different error messages confirm username enumeration is possible, but that's not needed here since I already have the username `carlos` given to me. I just need to get the password.

**2) Discovering the Protection Mechanism**

When I attempted to brute-force passwords for `carlos`, I was blocked 🥲:

> "You have made too many incorrect login attempts. Please try again in 1 minute(s)."

The password list has 100 lines... that means I would wait around 33 minutes to solve this if I can't get around the block.

**3) Finding the Logic Flaw**

But then I noticed something! If I login to a valid account before the 3 attempts, the count resets! So, all I have to do is try 2 passwords, then try `wiener:peter` and repeat the cycle.

**4) Automated Brute-Force with Turbo Intruder**

I used Turbo Intruder with this strategy:

- Read all passwords from the wordlist
- For every 2 password attempts on `carlos`, insert 1 successful `wiener` login

This prevents the counter from ever reaching 3 consecutive failed attempts

Here's the script I used:

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           requestsPerConnection=1,
                           pipeline=False
                           )
    passwords = [line.rstrip() for line in open('/home/kali/pw')]
    password_index = 0
    total_passwords = len(passwords)
    while password_index < total_passwords:
        engine.queue(target.req, ['wiener', 'peter'])
        for i in range(2):
            if password_index < total_passwords:
                engine.queue(target.req, ['carlos', passwords[password_index]])
                password_index += 1
def handleResponse(req, interesting):
    if req.status != 404:
        table.add(req)
```

1. **Success!**

After the script ran, I got a bunch of status code "302" on every `wiener:peter`. but between them stood out one "302" that was for `carlos:summer`

I manually logged in with carlos:summer and the lab was solved! 🥳

**Answer**: summer ✅

---

# What I'd Do Next (Blue Team) {#what-id-do-next}

- Ensure that a successful login for "User A" does not reset the failure counter for "User B".
- I'd use a better approach. Example: If an IP has 6 failures in an hour, it gets flagged regardless of whether it managed to log in successfully once in the middle of that window.
- I would configure the WAF to detect "interleaved" login patterns where a single IP is jumping between multiple accounts rapidly. If I see a successful login immediately following a series of failures, I'd flag that session as "High Risk" and force an MFA prompt or an email notification to the user, even if the password was correct.

# Try This Lab Yourself {#try-this-lab-yourself}

🔗 Lab Link: [PortSwigger Lab: Broken Brute-Force Protection, IP Block](https://portswigger.net/web-security/learning-paths/authentication-vulnerabilities/password-based-vulnerabilities/authentication/password-based/lab-broken-bruteforce-protection-ip-block){:target="\_blank"}
