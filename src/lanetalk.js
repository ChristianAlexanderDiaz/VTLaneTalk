import puppeteer from "puppeteer"; // Import Puppeteer for web scraping
import { initializeApp } from "firebase/app"; // Import Firebase app initialization
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc} from "firebase/firestore"; // Import Firestore services
import readline from 'readline';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8DIsJawpSnsoQHzqbwhILcBlwLmQpLK4",
  authDomain: "vtlanetalk-61fad.firebaseapp.com",
  projectId: "vtlanetalk-61fad",
  storageBucket: "vtlanetalk-61fad.appspot.com",
  messagingSenderId: "208251209615",
  measurementId: "G-7KXPGPRSRJ"
};

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// Function to get the complete bowler list from the database, including nicknames
async function getCompleteBowlerList() {
  const querySnapshot = await getDocs(collection(db, "bowlers"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Function to scrape data from the webpage
async function scrapeData() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const url = "https://beta.lanetalk.com/bowlingcenters/367895d6-d3f2-4d89-b4a6-9f11ea7af700/completed";
  const maxAttempts = 3;
  let attemptCount = 0;
  let data = null;

  while (attemptCount < maxAttempts) {
    attemptCount++; // Increment the attempt counter
    console.log(`Attempt ${attemptCount} to load the page...`);

    try {
      // Navigate to the target URL with a 1-minute timeout
      await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

      // Wait for the data to load
      await page.waitForSelector(".player.ng-star-inserted");

      // Extract data from the page
      data = await page.evaluate(() => {
        const players = Array.from(document.querySelectorAll('.player.ng-star-inserted'));

        return players.map(player => {
          const nameText = player.querySelector('.nameAndDate > .name').innerText;
          const [name, team] = nameText.split('\n');
          const date = player.querySelector('.date').innerText;
          const scoreElements = player.querySelectorAll('.numbersWrapper > .numberBatch');

          // Convert NodeList to Array of scores and filter out empty strings
          const scoresArray = Array.from(scoreElements)
            .map(el => el.innerText.trim()) // Trim any whitespace around the score
            .filter(score => score !== '' && !isNaN(score)); // Filter out empty strings and non-numeric values

          return { name, team, scoresArray, date };
        });
      });

      console.log(`Successfully loaded the page on attempt ${attemptCount}.`);
      break; // Exit the loop if data was successfully scraped

    } catch (error) {
      console.error(`Attempt ${attemptCount} failed: ${error.message}`);

      if (attemptCount >= maxAttempts) {
        console.error("Maximum number of attempts reached. Unable to load the page.");
        throw error; // Re-throw the error if max attempts are reached
      }

      console.log(`Retrying... (${maxAttempts - attemptCount} attempts left)\n`);
    }
  }

  await browser.close();
  return data;
}

async function updateBowlerScores(bowlerId, newScores) {
  const bowlerRef = doc(db, "bowlers", bowlerId);
  await updateDoc(bowlerRef, {
    scores: newScores
  });
}

// Function to add a new bowler to the database with optional nicknames
async function addNewBowler(name, nicknames = []) {
  await addDoc(collection(db, "bowlers"), {
    name: name,
    nicknames: nicknames,
    scores: []
  });
  console.log(`Added new bowler: ${name} with nicknames: ${nicknames.join(', ')}`);
}

// Function to prompt for adding new bowlers
async function promptForNewBowlers() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let addMore = true;

  while (addMore) {
    await new Promise((resolve) => {
      rl.question('Enter the name of the new bowler (or press Enter to stop adding): ', async (name) => {
        if (name) {
          rl.question('Do they have any nicknames? (Separate with commas if multiple): ', async (nicknamesInput) => {
            const nicknames = nicknamesInput ? nicknamesInput.split(',').map(n => n.trim()) : [];
            await addNewBowler(name, nicknames);
            resolve();
          });
        } else {
          addMore = false;
          resolve();
        }
      });
    });
  }

  rl.close();
}

// Function to normalize names (capitalize first letter, lowercase the rest)
function normalizeName(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Function to find a bowler by name or nickname
function findBowlerByNameOrNickname(playerName, bowlers) {
  const normalizedPlayerName = normalizeName(playerName);

  // Check if the normalized name matches the bowler's name or any nickname
  return bowlers.find(bowler => 
    normalizedPlayerName === bowler.name || 
    (bowler.nicknames && bowler.nicknames.map(normalizeName).includes(normalizedPlayerName))
  );
}

// Main function to manage real-time score updates
async function main() {
  await promptForNewBowlers(); // Prompt to add new bowlers before starting

  let bowlers = await getCompleteBowlerList(); // Get the complete bowlers list

  // Normalize all bowler names in the database
  bowlers = bowlers.map(bowler => ({
    ...bowler,
    name: normalizeName(bowler.name),
    nicknames: bowler.nicknames ? bowler.nicknames.map(normalizeName) : []
  }));

  let cycleCount = 0; // Initialize a counter for the number of loops

  while (true) { // Real-time updates
    cycleCount++; // Increment the counter for each loop iteration
    console.log(`Starting cycle ${cycleCount}...`); // Display the current cycle count

    const scrapedData = await scrapeData(); // Scrape data from LaneTalk

    for (const player of scrapedData) {
      // Find the bowler by name or nickname
      const bowler = findBowlerByNameOrNickname(player.name, bowlers);

      if (bowler) { // If the bowler exists in the database, update their scores
        let newScoresArray = [...bowler.scores, ...player.scoresArray]; // Combine existing and new scores

        if (newScoresArray.length <= 2) {
          if (player.scoresArray.length === 1) {
            console.log(`Waiting for ${bowler.name}'s second score: [${newScoresArray.join(', ')}]`);
          } else if (newScoresArray.length === 2) {
            await updateBowlerScores(bowler.id, newScoresArray); // Update Firebase with new scores
            console.log(`Updated scores for ${bowler.name}: [${newScoresArray.join(', ')}]`);
          }
        } else {
          // Limit to only two scores
          newScoresArray = newScoresArray.slice(0, 2);
          await updateBowlerScores(bowler.id, newScoresArray); // Update Firebase with new scores
          console.log(`Updated scores for ${bowler.name}: [${newScoresArray.join(', ')}]`);
        }
      } else {
        console.log(`${player.name} not found in the database.`);
      }
    }

    console.log(`Cycle ${cycleCount} completed.\n`); // Indicate that the current cycle is complete

    // Start the countdown for the next cycle
    const countdownSeconds = 60; // Time in seconds for the countdown
    for (let i = countdownSeconds; i >= 0; i--) {
      process.stdout.write(`\rTime left until next cycle: ${i} seconds`); // Overwrite the current line with time left
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
    }

    console.log('\n'); // Move to the next line after the countdown

    // Check if all of the bowlers have finished
    if (scrapedData.every(player => player.scoresArray.length === 0)) {
      console.log("All bowlers finished, stopping the script.");
      break; // Exit the loop
    }
  }
}

main();