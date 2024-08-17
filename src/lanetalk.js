import puppeteer from "puppeteer"; // Import Puppeteer for web scraping
import { initializeApp } from "firebase/app"; // Import Firebase app initialization
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, getDoc} from "firebase/firestore"; // Import Firestore services
import readline from 'readline'; // Able to interact with script in the terminal

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
const dayUUID = "GnvK6kblb1OSoV4gnKFmV"

/* ------------ GETTERS FROM CLOUD FIRESTORE ------------ */

/**
 * Retrieves a list of all bowlers from the Firestore collection.
 * 
 * @returns array of 'bowlers' with their corresponding IDs and its data
 */
async function getCompleteBowlerList() {
  const querySnapshot = await getDocs(collection(db, "bowlers"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Confirm that the maxScoreArrayLength variable exists and return it.
 * 
 * @returns An integer that determines what day it is in the season by multiples of 2.
 * e.g. 2 = 1st day, 4th = 2nd day.
 */
async function getMaxScoreArrayLength() {
  const docRef = doc(db, "variables", dayUUID); // Refer to the 'variables' collection
  const docSnap = await getDoc(docRef);

  // Check to see if the `maxScoreArrayLength` still exists
  if (docSnap.exists()) {
    return docSnap.data().maxScoreArrayLength;
  } else {
    return null; // ! The global variable cannot be reached to check what day it is
  }
}


/**
 * Updates the `maxScoreArrayLength` field in a Firestore document with a new length value.
 * 
 * @param newLength - The new length that you want to set for the
 * `maxScoreArrayLength` field in the document stored in the Firestore database. This function updates
 * the `maxScoreArrayLength` field with the new length provided as the parameter.
 */
async function updateMaxScoreArrayLength(newLength) {
  const docRef = doc(db, "variables", dayUUID);
  await updateDoc(docRef, {maxScoreArrayLength: newLength }); // Value will changed based on the day
}

/**
 * Uses Puppeteer to scrape data from a specific URL, handling up to 3
 * attempts to load the page and extract information about players and their scores.
 * 
 * @returns The `scrapeData` function returns the scraped data from the webpage in the form of an array
 * of objects. Each object in the array represents a player and contains their name, team, an array of
 * scores, and the date of the game.
 */
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

/**
 * Updates the scores of a bowler in a Firestore database.
 * 
 * @param bowlerId - A unique identifier of the bowler whose scores you want to update in the database.
 * @param newScores - An array of scores that's updated for a specific bowler identified by the `bowlerId`.
 */
async function updateBowlerScores(bowlerId, newScores) {
  const bowlerRef = doc(db, "bowlers", bowlerId);
  await updateDoc(bowlerRef, {
    scores: newScores
  });
}

/**
 * Adds a new bowler with a given name and optional nicknames to a collection in a database.
 * 
 * @param name - A name of the new bowler being added to the database.
 * @param nicknames - An optional parameter that allows you to provide an array of nicknames 
 * for the bowler being added. If no nicknames are provided, it defaults to an empty array.
 */
async function addNewBowler(name, nicknames = []) {
  await addDoc(collection(db, "bowlers"), {
    name: name,
    nicknames: nicknames,
    scores: []
  });
  console.log(`Added new bowler: ${name} with nicknames: ${nicknames.join(', ')}`);
}

/**
 * Prompts the user to enter the name and nicknames of new bowlers
 * until the user decides to stop adding more.
 */
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

/**
 * Takes a name as input, converts it to lowercase, capitalizes the first
 * letter of each word, and returns the normalized name.
 * 
 * @param name - A name as input unchanged.
 * 
 * @returns A normalized name like "chris" -> "Chris".
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Searches for a bowler by their name or nickname in a given array of bowlers.
 * 
 * @param playerName - A name or nickname of a bowler that you want to
 * search for in the `bowlers` database.
 * @param bowlers - An array of objects representing different bowlers. Each bowler object has
 * properties like `name` (the bowler's name) and `nicknames` (an array of nicknames associated with
 * the bowler).
 * 
 * @returns Returns the bowler object from the `bowlers` array that matches the 
 * normalized `playerName` or any of the normalized nicknames in the bowlers' data.
 */
function findBowlerByNameOrNickname(playerName, bowlers) {
  const normalizedPlayerName = normalizeName(playerName);

  // Check if the normalized name matches the bowler's name or any nickname
  return bowlers.find(bowler => 
    normalizedPlayerName === bowler.name || 
    (bowler.nicknames && bowler.nicknames.map(normalizeName).includes(normalizedPlayerName))
  );
}

/**
 * The main function manages real-time updates of bowler scores by scraping data, updating scores in a
 * database, and handling countdowns between cycles.
 */
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

    const maxScoreArrayLength = await getMaxScoreArrayLength(); // Get the current "day"
    const scrapedData = await scrapeData(); // Scrape data from LaneTalk

    for (const player of scrapedData) {
      // Find the bowler by name or nickname
      const bowler = findBowlerByNameOrNickname(player.name, bowlers);

      if (bowler) { // If the bowler exists in the database, begin the process
        const firstGameIndex = maxScoreArrayLength - 2;
        const secondGameIndex = firstGameIndex + 1;

        let databaseScoresArray = [...bowler.scores]; // Existing scores from the database

        console.log(`Initial databaseScoresArray for ${bowler.name}:`, databaseScoresArray);

        // ! If the first game for the days' slot is empty AND if the scraped data contains at least 1 item
        if (!databaseScoresArray[firstGameIndex] && player.scoresArray.length > 0) {
          databaseScoresArray[firstGameIndex] = player.scoresArray[0]; // Insert the first score
          await updateBowlerScores(bowler.id, databaseScoresArray); // Update the database with the first score
          console.log(`${bowler.name}'s first score updated to ${player.scoresArray[0]}`);

        // ! If the second slot for the days' slot is empty AND if the scraped data contains at least 2 items
        }
        if (!databaseScoresArray[secondGameIndex] && player.scoresArray.length > 1) {
          databaseScoresArray[secondGameIndex] = player.scoresArray[1]; // Insert second score
          await updateBowlerScores(bowler.id, databaseScoresArray); // Update the database with the second score
          console.log(`${bowler.name}'s second score updated to ${player.scoresArray[1]}`);
        }

        // ! If both games are filled, increment the maxScoreArrayLength for the next session
        if (databaseScoresArray[firstGameIndex] && databaseScoresArray[secondGameIndex]) {
          console.log(`Both scores have already beenupdated for ${bowler.name}: [${databaseScoresArray[firstGameIndex]}, ${databaseScoresArray[secondGameIndex]}]`);
          await updateMaxScoreArrayLength(maxScoreArrayLength + 2);
          console.log(`Updated maxScoreArrayLength to ${maxScoreArrayLength + 2}`);
        }
      } else {
        // console.log(`${player.name} not found in the database.`); // ! Not found in the database
      }
    }

    console.log(`Cycle ${cycleCount} completed.\n`); // Indicate that the current cycle is complete

    // Start the countdown for the next cycle
    const countdownSeconds = 3; // Time in seconds for the countdown
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