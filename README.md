# VTLaneTalk

The Bowling Club at Virginia Tech players will be able to get their stats through this system.

This eliminates 1 hour/day of manual data collection on an Excel sheet by automating a Node.js + Puppeteer scraper that ingests, filters, and pushes live Bowling Club members scores from LaneTalk's website to Firestore and back to the website in 60-second cycles.
This code ensues that 100% score completeness is achieved by auto-padding missing entries for absent players and adding interactive CLI prompts for configuration--having manual setup time for anyone updating.
