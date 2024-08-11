const puppeteer = require("puppeteer"); // Web Scraping
const readline = require("readline"); // For user interaction
const sqlite3 = require('sqlite3').verbose(); // SQLite library
const path = require('path');

// Setup for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const competitiveBowlers = ["1", "Heather", "Chloe"].map(name => name.toLowerCase());

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
  const dbPath = path.resolve(__dirname, 'bowling_score.db');
  const db = new sqlite3.Database(dbPath);

  // Create the Players and Scores tables if they don't exist
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Players (
        Name TEXT PRIMARY KEY
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Scores (
        PlayerName TEXT,
        Score1 INTEGER,
        Score2 INTEGER,
        FOREIGN KEY(PlayerName) REFERENCES Players(Name)
      )
    `);
  });


  // Insert entries and log the result
  for (const player of data) {
    const name = player[0]; // Extract the name from the array
    const scores = player[2].map(score => parseInt(score, 10)); // Extract and convert the scores to integers

    // Insert player if not already in the Players table
    db.run(`INSERT OR IGNORE INTO Players (Name) VALUES (?)`, [name]);

    // Insert the scores for the session
    db.run(
      `INSERT INTO Scores (PlayerName, Score1, Score2) VALUES (?, ?, ?)`,
      [name, scores[0], scores[1]],
      function(err) {
        if (err) {
          console.error("Failed to insert data:", err);
        } else {
          console.log("Inserted data:", { name, score1: scores[0], score2: scores[1] });
        }
      }
    );
  }

  db.close(err => {
    if (err) {
      console.error("Failed to close database:", err);
    } else {
      console.log("Database connection closed.");
    }
  });
}

main();