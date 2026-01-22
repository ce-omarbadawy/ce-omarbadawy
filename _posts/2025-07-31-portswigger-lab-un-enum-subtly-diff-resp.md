---
layout: post
title: "PortSwigger Lab: Username enumeration via subtly different responses"
date: 2025-07-31
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
  - "Burp Suite"
---

# PortSwigger Lab: Username Enumeration via Subtly Different Responses

# Table of Contents

- [Overview / Goal](#overview--goal)
- [Lab Setup and Tools](#lab-setup-and-tools)
- [What's the login info?](#whats-the-login-info)
  - [Solution Steps](#solution)
- [What I'd Do Next (Blue Team)](#what-id-do-next)
- [Try This Lab Yourself](#try-this-lab-yourself)

# Overview / Goal {#overview--goal}

> "This lab is subtly vulnerable to username enumeration and password brute-force attacks. It has an account with a predictable username and password."

So again, same mission: **find the correct login credentials**.

Wordlists provided by PortSwigger:

- https://portswigger.net/web-security/authentication/auth-lab-usernames
- https://portswigger.net/web-security/authentication/auth-lab-passwords

# Lab Setup and Tools {#lab-setup-and-tools-used}

- Burp Suite + Firefox (through FoxyProxy)
- Burp Intruder

I first triggered a failed login to capture the POST request. Example:

```http
POST /login HTTP/2
Content-Type: application/x-www-form-urlencoded
username=FAKE&password=FAKE
```

The response said:

> Invalid username or password.

---

# What's the Login Info? {#whats-the-login-info}

## Solution Steps {#solution}

**1) Enumerate usernames**

I sent the request to **Intruder**, set the **username** as the payload, and left the password static (`FAKE`).

This labs trick is subtle differences in responses, not obvious messages like "Invalid username" vs "Invalid password," but _tiny_ differences like an extra space or a typo.

Before launching the attack, I opened the **Intruder > Settings** tab on the right side and enabled **Grep - Extract**.

Then I highlighted and extracted the line containing `"Invalid username or password."`. This way, Burp shows any response that differs, even slightly.

I loaded the PortSwigger usernames wordlist and started the attack.

Every request looked the same… except one. The username **`applications`** .

**Username:** `applications` ✅

**2) Brute-force password**

Next, I removed the payload from the username and set it statically to `applications`.

Then I moved the payload position to the **password** field and switched the wordlist to the passwords one.

Started round two of the attack.

Again, every request returned **Status Code 200** but one. And instead it gave **Status Code 302** . and that was for password **`ranger`**.

**Password:** `ranger` ✅

**3) Verify**

I went back to the lab's login page, entered `applications:ranger`, and it worked.

Account page loaded. Lab solved 😁

**Answer:** `applications:ranger` ✅

---

# What I'd Do Next (Blue Team) {#what-id-do-next}

- Just like the last lab, I would normalize error messages, response lengths, and status codes to prevent enumeration.

# Try This Lab Yourself {#try-this-lab-yourself}

🔗 Lab Link: [PortSwigger Lab: Username enumeration via subtly different responses](https://portswigger.net/web-security/learning-paths/authentication-vulnerabilities/password-based-vulnerabilities/authentication/password-based/lab-username-enumeration-via-subtly-different-responses){:target="\_blank"}
