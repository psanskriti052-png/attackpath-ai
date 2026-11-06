# AttackPath AI

**Autonomous VAPT agent that maps the path an attacker would take, not just a list of vulnerabilities.**

Built for the DataOps Innovation Hackathon (Cybersecurity) · Problem Statement: AI Agent for Automated Penetration Testing

🔗 **Live Demo:** https://ethereal-path-find-ai.base44.app

---

## Problem
Traditional vulnerability scanners give long lists of isolated findings. Security teams don't know which issues actually chain together into a real attack, so they can't prioritise what to fix first.

## Our Solution
AttackPath AI is an AI-driven VAPT (Vulnerability Assessment and Penetration Testing) agent. You point it at an authorised target, approve the plan, and it runs the assessment. It then correlates the findings into the most likely **attack path** an attacker would take.

## Key Features
- **Autonomous assessment:** scans an in-scope target and runs the test steps with a human approval step
- **Attack-path correlation:** links individual findings into one attack chain
- **Scope Guard:** blocks any host that is not localhost, the demo target, or a confirmed lab target (authorised testing only)
- **Scan Workspace:** live view of scan progress and results
- **Dashboard:** portfolio exposure and the latest assessment at a glance
- **Demo Mode:** safe demo target (`demo.vulnshop.local`) for showcasing the tool

## Tech Stack
- Frontend: React (JSX), Tailwind CSS
- Platform: Base44 (AI app builder) with backend functions and entities
- AI-assisted analysis for attack-path reasoning

## Project Structure
## How to Use
1. Open the live demo link above.
2. Enter an in-scope target (e.g. `https://demo.vulnshop.local`).
3. Click **Start assessment** and approve the plan.
4. View the scan progress and the correlated attack path on the dashboard.

## Ethical Use
This tool is for **authorised security testing only**. The built-in scope guard prevents scanning of unapproved hosts.

## Author
Sanskriti · Hackathon participant
