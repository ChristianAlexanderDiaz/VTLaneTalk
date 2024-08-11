const puppeteer = require("puppeteer"); // Web Scraping
const readline = require("readline"); // For user interaction
const sqlite3 = require('sqlite3').verbose(); // SQLite library
const path = require('path');

// Setup for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const competitiveBowlers = ["Jess", "Aadi"].map(name => name.toLowerCase());

async function main() {
  try {
    const data = await scrapeData();
    console.log("Scraped Data:");
    console.table(data);

    const filteredData = filterBowlersByName(data, competitiveBowlers);
    await storeDataInSQLite(filteredData);
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    rl.close();
  }
}

// Function to scrape data from the webpage
async function scrapeData() {
  const browser = await puppeteer.launch({ headless: "new"});
  const page = await browser.newPage();
  const url = "https://beta.lanetalk.com/bowlingcenters/367895d6-d3f2-4d89-b4a6-9f11ea7af700/completed"

  // Navigate to the target URL
  await page.goto(url, 
    { waitUntil: "networkidle0" }
  );

  // Wait for the data to load
  await page.waitForSelector(".player.ng-star-inserted");

  // Extract data from the page
  const data = await page.evaluate(() => {
    const players = Array.from(document.querySelectorAll('.player.ng-star-inserted')); // div that contains data

    return players.map(player => {
      const nameText = player.querySelector('.nameAndDate > .name').innerText;
      const [name, team] = nameText.split('\n');
      const date = player.querySelector('.date').innerText;
      const scoreElements = player.querySelectorAll('.numbersWrapper > .numberBatch'); // NodeList

      // Convert NodeList to Array
      const scoresArray = Array.from(scoreElements).map(el => el.innerText);

      // Output the values to debug
      console.log('Scores Array:', scoresArray);

      return [name, team, scoresArray, date];
    });
  });

  await browser.close();
  return data;
}

// Function to filter data for only competitve bowlers in the list
function filterBowlersByName(data, competitiveBowlers) {
  return data.filter(player =>
    competitiveBowlers.includes(player[0].toLowerCase())
  );
}

// Function to store data in an SQLite database
async function storeDataInSQLite(data) {
  const dbPath = path.resolve(__dirname, 'bowling_scores.db');
  const db = new sqlite3.Database(dbPath);

  // Create a table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS Data (
      Name TEXT,
      Team TEXT,
      Scores TEXT,
      Date TEXT
    )
  `);

  // Prepare inserting the data
  const statement = db.prepare("INSERT INTO Data (Name, Team, Scores, Date) VALUES (?, ?, ?, ?)");

  // Insert entries and log the result
  data.forEach(item => {
    statement.run(item[0], item[1], item[2].join(', '), item[3], function(err) {
      if (err) {
        console.error("Failed to insert data:", err);
      } else {
        console.log("Inserted data:", item);
      }
    });
  });

  statement.finalize(err => {
    if (err) {
      console.error("Failed to finalize statement:", err);
    } else {
      console.log("Statement finalized successfully.");
    }
    db.close(err => {
      if (err) {
        console.error("Failed to close database:", err);
      } else {
        console.log("Database connection closed.");
      }
    });
  });
}

main();