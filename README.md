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
## Setup and Execution

### Option 1: Run the live demo (quickest)
1. Open the live demo: https://burrowing-path-guard-ai.base44.app
2. Enter the demo target `https://demo.vulnshop.local`.
3. Click **Start assessment**, approve the plan, and view the findings and attack paths.

### Option 2: Run locally
Requirements: Node.js 18 or higher

1. Clone the repo: `git clone https://github.com/psanskriti052-png/attackpath-ai.git`
2. Go into the folder: `cd attackpath-ai`
3. Install packages: `npm install`
4. Start the app: `npm run dev`
5. Open the local link shown in the terminal (usually http://localhost:5173)

Note: the app was built on Base44, and the backend runs on the Base44 platform. The live demo link is the fully working version.

## Ethical Use
This tool is for **authorised security testing only**. The built-in scope guard prevents scanning of unapproved hosts.

## Author
Sanskriti · Hackathon participant
