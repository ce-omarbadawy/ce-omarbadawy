---
layout: post
title: "PortSwigger Lab: 2FA Simple Bypass"
date: 2025-08-05
categories:
  [
    "PortSwigger",
    "Practice",
    "Authentication Vulnerabilities",
    "Vulnerabilities in multi-factor authentication",
  ]
tags:
  - "PortSwigger"
  - "Authentication Vulnerabilities"
  - "Vulnerabilities in multi-factor authentication"
  - "2FA"
  - "Logic Flaws"
  - "Burp Suite"
---

# PortSwigger Lab: 2FA Simple Bypass

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools](#lab-setup-and-tools)
- [Solution Steps](#solution-steps)
- [What I'd Do Next (Blue Team)](#what-id-do-next)
- [Try This Lab Yourself](#try-this-lab-yourself)

---

# Overview / Goal {#overview--goal}

> "This lab's two-factor authentication can be bypassed. You have already obtained a valid username and password, but do not have access to the user's 2FA verification code. To solve the lab, access Carlos's account page."
>
> Your credentials: `wiener:peter`  
> Victim's credentials: `carlos:montoya`

The goal is clear. Log into Carlos's account without providing a valid 2FA code.

# Lab Setup and Tools {#lab-setup-and-tools-used}

- Burp Suite + Firefox (through FoxyProxy)

No automation needed for this one.

---

# Solution Steps {#solution-steps}

**1) Valid User Analysis**

I started by logging in with my own credentials `wiener:peter`.

After entering the username and password, the site asked for a 4-digit 2FA code. There was an option to access an in-app email client, which contained the code. Entering it worked, and I was logged in successfully.

I looked around using Burp and nothing interesting showed up or gave me any clues... I thought, Okay, let me try the victim's Creds.

**2) Testing the Victim Account**

Next, I logged out and tried the victim's credentials `carlos:montoya`.

The login worked, but I got stuck at the 2FA prompt. The button that shows the in-app email client disappeared. This means no code.
I looked around with Burp again, and again, No clues.

At this point, it was clear the lab wasn't about brute-forcing the code, stealing it, or abusing the email client. It was as the title said, much simpler than that!

So I went back to basics.

I thought, let me try my given account again and I noticed that the URL showed:

```html
https://0ad4008503c851308216d3ca00bf00e1.web-security-academy.net/my-account?id=wiener
```

and that gave me an idea 😈

**3) Skipping the 2FA Step Entirely**

Sometimes in a badly implemented 2FA, after putting the login info and then being redirected to 2FA page, the user is _technically_ logged-in here. In this case, it's sometimes possible to fully skip the 2FA if the website doesn't validate the step we're in.

So, While at Carlos's 2FA page, I manually changed the URL to the way it looked like in an already logged-in account and just replaced the username from `wiener` to `carlos`:

```html
https://0ad4008503c851308216d3ca00bf00e1.web-security-academy.net/my-account?id=carlos
```

And that was it! ✅

The account page loaded, and the lab was solved.

---

# What I'd Do Next (Blue Team) {#what-id-do-next}

- Treat 2FA as a proper authorization boundary. The session won't be marked as authenticated until **all** authentication factors are verified.
- Enforce server-side checks for authentication state on every endpoint.

# Try This Lab Yourself {#try-this-lab-yourself}

🔗 Lab Link: [PortSwigger Lab: 2FA Simple Bypass](https://portswigger.net/web-security/learning-paths/authentication-vulnerabilities/vulnerabilities-in-multi-factor-authentication/authentication/multi-factor/lab-2fa-simple-bypass){:target="\_blank"}
