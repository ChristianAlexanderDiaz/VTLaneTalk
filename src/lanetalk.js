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

/**
 * Prompts the user to confirm or modify the maxScoreArrayLength.
 * 
 * @param currentLength - The current maxScoreArrayLength found in the database.
 * 
 * @returns A promise that resolves with the confirmed or new maxScoreArrayLength.
 */
async function promptForMaxScoreArrayLength(currentLength) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`maxScoreArrayLength found: ${currentLength}. Is this correct? (yes/no) `, async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        rl.close();
        resolve(currentLength);
      } else {
        rl.question('Please enter the correct maxScoreArrayLength: ', async (newLength) => {
          const parsedLength = parseInt(newLength, 10);
          if (isNaN(parsedLength)) {
            console.log('Invalid input. Keeping the original value.');
            rl.close();
            resolve(currentLength);
          } else {
            try {
              // Update the value in Firestore
              const querySnapshot = await getDocs(collection(db, "variables"));
              if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref; // Get the reference to the document
                await updateDoc(docRef, { maxScoreArrayLength: parsedLength });
                console.log(`maxScoreArrayLength successfully updated to ${parsedLength} in the database.`);
                rl.close();
                resolve(parsedLength);
              } else {
                console.log("No document found in the 'variables' collection to update.");
                rl.close();
                resolve(currentLength);
              }
            } catch (error) {
              console.error("Error updating maxScoreArrayLength in the database: ", error);
              rl.close();
              resolve(currentLength); // Resolve with the old value in case of error
            }
          }
        });
      }
    });
  });
}

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
 * Retrieves the maxScoreArrayLength from the Firestore collection.
 * 
 * @returns An integer that determines what day it is in the season by multiples of 2.
 * e.g. 2 = 1st day, 4 = 2nd day. Returns null if the document or field does not exist.
 */
async function getMaxScoreArrayLength() {
  const querySnapshot = await getDocs(collection(db, "variables"));

  // Since we expect only one document, we can directly access it
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();

    if (data.maxScoreArrayLength && typeof data.maxScoreArrayLength === 'number') {
      console.log("maxScoreArrayLength found:", data.maxScoreArrayLength);
      return data.maxScoreArrayLength;
    } else {
      console.log("maxScoreArrayLength field is missing or not a number.");
      return null;
    }
  } else {
    console.log("No documents found in 'variables' collection.");
    return null;
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
  if (typeof newLength !== 'number') {
    console.error("Invalid newLength value. It must be a number.");
    return;
  }

  // Use the same logic to get the document ID correctly
  const querySnapshot = await getDocs(collection(db, "variables"));
  
  if (!querySnapshot.empty) {
    const docRef = querySnapshot.docs[0].ref; // Get the reference to the first (and only) document

    try {
      await updateDoc(docRef, {
        maxScoreArrayLength: newLength // Update the value
      });
      console.log("Document successfully updated!");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  } else {
    console.log("No document found in the 'variables' collection to update.");
  }
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

async function main() {
  await promptForNewBowlers(); // Prompt to add new bowlers before starting
  let bowlers = await getCompleteBowlerList(); // Get the complete bowlers list

  // Normalize all bowler names in the database
  bowlers = bowlers.map(bowler => ({
    ...bowler,
    name: normalizeName(bowler.name),
    nicknames: bowler.nicknames ? bowler.nicknames.map(normalizeName) : []
  }));

  let activeList = []; // Initialize an empty active list
  let cycleCount = 0; // Initialize a counter for the number of loops

  // Initialize maxScoreArrayLength at the beginning
  let maxScoreArrayLength = await getMaxScoreArrayLength();
  maxScoreArrayLength = await promptForMaxScoreArrayLength(maxScoreArrayLength);

  while (true) { // Keep looping until we manually break

    cycleCount++; // Increment the counter for each loop iteration
    console.log(`Starting cycle ${cycleCount}...`); // Display the current cycle count

    const scrapedData = await scrapeData(); // Scrape data from LaneTalk

    for (const player of scrapedData) {
      // Find the bowler by name or nickname
      const bowler = findBowlerByNameOrNickname(player.name, bowlers);

      if (bowler) { // If the bowler exists in the database, begin the process
        const firstGameIndex = maxScoreArrayLength - 2; //even slot
        const secondGameIndex = maxScoreArrayLength - 1; //odd slot

        // Fetch the most recent scores from Firestore
        let bowlerRef = doc(db, "bowlers", bowler.id);
        let bowlerSnapshot = await getDoc(bowlerRef);
        let databaseScoresArray = bowlerSnapshot.data().scores || [];

        console.log(`Initial databaseScoresArray for ${bowler.name}:`, databaseScoresArray);

        // Case 1: Bowler is not in the active list, update the first score and add them to the active list
        if (!activeList.includes(bowler.id)) {
          if (!databaseScoresArray[firstGameIndex] && player.scoresArray.length > 0) {
            databaseScoresArray[firstGameIndex] = player.scoresArray[0]; // Insert the first score
            await updateBowlerScores(bowler.id, databaseScoresArray); // Update the database with the first score
            console.log(`${bowler.name}'s first score updated to ${player.scoresArray[0]}`);

            activeList.push(bowler.id); // Add bowler to the active list

            // Print the entire active list array
            console.log("Current active list (IDs):", activeList); // Print the raw array of IDs
            console.log("Current active list (Names):", activeList.map(id => {
              const bowler = bowlers.find(b => b.id === id);
              return bowler ? bowler.name : "Unknown";
            }));
          }
        }
        // Case 2: Bowler is already in the active list, update the second score and remove them from the active list
        else {
          if (!databaseScoresArray[secondGameIndex] && player.scoresArray.length > 1) {
            databaseScoresArray[secondGameIndex] = player.scoresArray[1]; // Insert the second score
            await updateBowlerScores(bowler.id, databaseScoresArray); // Update the database with the second score
            console.log(`${bowler.name}'s second score updated to ${player.scoresArray[1]}`);

            activeList = activeList.filter(id => id !== bowler.id); // Remove bowler from the active list

            // Print the entire active list array
            console.log("Current active list (IDs):", activeList); // Print the raw array of IDs
            console.log("Current active list (Names):", activeList.map(id => {
              const bowler = bowlers.find(b => b.id === id);
              return bowler ? bowler.name : "Unknown";
            }));

            console.log(`${bowler.name} has completed both scores.`);
          }
        }
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

    // Break the loop if all active bowlers have completed their scores
    if (activeList.length === 0) {
      console.log("All bowlers have completed both scores, stopping the script.");
      break; // Exit the loop
    }
  }

  // After all bowlers have their scores updated, finalize the session
  await updateMaxScoreArrayLength(maxScoreArrayLength + 2);
  console.log(`Updated maxScoreArrayLength to ${maxScoreArrayLength + 2}`);

  console.log("Script completed successfully. Exiting...");
  process.exit(0); // Exit the process
}

main();