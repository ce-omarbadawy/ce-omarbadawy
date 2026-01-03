---
layout: post
title: "I Don't Need Your Password, I Just Need Your Pattern"
date: 2025-08-04
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
  - "Brute Force"
  - "Rate Limiting"
  - "Account Lock"
  - "Username Enumeration"
  - "Logic Flaws"
  - "Turbo Intruder"
  - "Burp Suite"
---

# I Don't Need Your Password, I Just Need Your Pattern

# Table of Contents

- [The Core Issue](#the-core-issue)
  - [What are Password-Based Auth Vulnerabilities?](#what-are-password-based-auth-vulnerabilities)
  - [Username Enumeration](#username-enumeration)
    - [Valid Users Behaviour](#valid-users-behaviour)
    - [Brute-force Protection Logic](#brute-force-protection-logic)
    - [Human Beings are Predictable](#human-beings-are-predictable)
    - [Account Locking is a Signal](#account-locking-is-a-signal)
  - [The Pattern](#the-pattern)
- [Takeaway](#takeaway)

---

# The Core Issue {#the-core-issue}

After going through several PortSwigger labs on the topic of "Authentication Vulnerabilities in password-based login", it's clearer that a login page is rarely just a "yes or no" gate. It can be a massive leak of information.

## What are Password-Based Auth Vulnerabilities? {#what-are-password-based-auth-vulnerabilities}

> "Password-based authentication is a method that requires the user to enter their credentials — username and password — in order to confirm their identity. Once credentials are entered, they are compared against the stored credentials in the system's database, and the user is only granted access if the credentials match."
>
> descope. (2023). What is Password-Based Authentication?. Identipedia. https://www.descope.com/learn/post/password-authentication

The vulnerability here isn't really the password itself, but more about the process.

Many developers think a login page is a simple lock. You have the key, or you don't. But, underneath the UI, the web app is making decisions, checking databases, comparing hashes, managing sessions, and more!

The vulnerability exists, and the entire system collapses if an attacker can:

- Identify valid usernames.
- Reduce the password search space.
- Automate attempts.
- Exploit badly implemented safety features.

If the login page does ANYTHING other than stay 100% silent and consistent, it's giving the attacker a map to get inside.

The labs weren't about "brute-forcing harder", they were about making the system talk.

---

## Username Enumeration {#username-enumeration}

This is the most basic mistake. The server reacts differently when you get the username right.

Every lab started the same way:
"Find a valid username."

And every time, the app leaked it. This happened through:

- Different error messages.
- Different response lengths.
- Different status codes.
- Different response times.
- Account lock behaviour.

In the first lab, I saw that "Invalid username" had a specific byte length. As soon as I hit a real user, the message changed to "Incorrect password" and the length jumped.

In another lab, it's not even a different message. It's just a missing period or an extra space. Using **Burp's Grep - Extract** was the only way I caught that without losing my mind.

Even when the message looked identical on the page, something behind the scenes wasn't.

### Valid Users Behaviour {#valid-users-behaviour}

If the username exists, the server does more work. This leaks through as:

- Longer response times while it's checking password hash.
- Lock counters incrementing.

Even when the error messages are identical, the server still has to work. If I gave it a massive 2000 character password:

1. The server sees the username is fake and quits immediately.
2. The server thinks "Okay, this user is real, now I have to hash this huge password to check it".

Even when developers normalise text and status codes, timing still betrayed them.

### Brute-force Protection Logic {#brute-force-protection-logic}

This was one of the coolest logic flaws. A lot of sites block your IP after 3 failed attempts. But, to be "helpful," they reset that counter if you successfully log in.

If I have my own valid credentials (`wiener:peter`), I can just do this:

- Attempt 1: Victim account (Fail)
- Attempt 2: Victim account (Fail)
- Attempt 3: **My account** (Success - Counter Resets!)
- Repeat.

The server thinks I'm just a guy who keeps forgetting his password but eventually gets it right. It never blocks me.

If the IP block is actually working, the attacker can just lie about who they are. By adding the `X-Forwarded-For` header and incrementing the number for every request, the server thinks the traffic is coming from a thousand different people instead of just one person.

Rate limiting and account locks sound strong on paper. But in practice, they fail because of logic mistakes. This showed in the labs through:

- Counters resetting after ANY successful login.
- IP-based limits that trust user-controlled headers.
- Locks only applying to real accounts.
- Protections focusing on one account instead of attack patterns.

### Human Beings are Predictable {#human-beings-are-predictable}

Once enumeration narrows the target, common human behaviours finish the job. People often make many predictable mistakes that make them easy targets for brute-forcing. Even with password policies, people are still predictable because they:

- Reuse base passwords.
- Increment numbers.
- Swap symbols.
- Follow memory-friendly rules.

### Account Locking is a Signal {#account-locking-is-a-signal}

If fake users never lock but real ones do, the web app is essentially just labelling valid accounts for free. This enables an attacker to use this as a denial of service. It also doesn't stop credential stuffing, and doesn't deal with low/slow attacks.

The labs were about using the _Lock_ to learn instead of trying to bypass it.

## The Pattern {#the-pattern}

Every lab was different but the lesson was always the same. The application leaked something!

That could be whether a user exists, whether a password check ran, a counter incremented, or was protection logic triggered? Once the observed state changes, authentication stops being a wall.

Attackers don't need your password, they need:

- Consistent behaviour.
- Measurable differences.
- Predictable users.
- Flawed assumptions in protection logic.

# Takeaway {#takeaway}

- Make every failure look, time, and behave the same.
- Never trust the client.
- Track behaviour and not just outcomes.
- Assume attackers can go slow and smart OR fast and chaotic.
- Use better/modern brute-force prevention.
