const puppeteer = require("puppeteer");
const readline = require("readline");
const { spawn } = require("child_process");
const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const namesToFind = [
  "Kiki",
  "Kristen",
  "Eric",
  "Susan",
  "Kellie",
  "Katelyn",
  "Ana",
  "Sam",
  "Ben",
];

(async () => {
  const scores = await scrapeData();

  const matchedScores = scores.filter((player) =>
    namesToFind.some((nameToFind) =>
      player[0].toLowerCase().includes(nameToFind.toLowerCase())
    )
  );

  const namesAndScores = matchedScores.map(
    (player) => `${player[0]} (${player[1]}): ${player[2]}`
  );

  const confirmation = await askForConfirmation(namesAndScores);

  if (confirmation === "y") {
    console.log("Confirmed. Pushing to Google Sheets...");
    await pushToGoogleSheets(matchedScores)
      .then(() => {
        console.log("Done.");
        rl.close();
      })
      .catch((err) =>
        console.error("Error pushing data to Google Sheets:", err)
      );
  } else if (confirmation === "n") {
    showAllData(scores);
  } else {
    console.log("Invalid input. Exiting program.");
    rl.close();
    await browser.close();
  }
})();

async function scrapeData() {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto(
    "https://beta.lanetalk.com/bowlingcenters/367895d6-d3f2-4d89-b4a6-9f11ea7af700/completed",
    {
      waitUntil: "networkidle0",
    }
  );

  await page.waitForSelector(".player.ng-star-inserted");

  const scores = await page.evaluate(() => {
    const players = Array.from(
      document.querySelectorAll(".player.ng-star-inserted")
    );
    return players.map((player) => {
      const nameText = player.querySelector(".nameAndDate > .name").innerText;
      const [name, team] = nameText.split("\n");
      const scoreElements = player.querySelectorAll(
        ".numbersWrapper > .numberBatch"
      );
      const scores = Array.from(scoreElements)
        .map((el) => el.innerText)
        .join(", ");
      return [name, team, scores];
    });
  });

  await browser.close();
  return scores;
}

async function askForConfirmation(namesAndScores) {
  return new Promise((resolve) => {
    rl.question(
      `Found the following Bowling Club members:\n${namesAndScores.join(
        "\n"
      )}\nWould you like to push this to Google Sheets? (Y/N) `,
      (answer) => {
        resolve(answer.toLowerCase());
      }
    );
  });
}

async function pushToGoogleSheets(scores) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "google-credentials.json", // Path to your JSON key file
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = process.env.SPREADSHEET_ID; // Spreadsheet ID
  const range = "Sheet1!A:A"; // Starting range in spreadsheet

  const existingData = await getExistingData(sheets, spreadsheetId, range);

  const { updateRows, appendRows } = parseDataForUpdate(existingData, scores);

  await updateAndAppendData(sheets, spreadsheetId, updateRows, appendRows);
}

async function getExistingData(sheets, spreadsheetId, range) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values || [];
}

function parseDataForUpdate(existingData, newData) {
  const updateRows = [];
  const appendRows = [];

  newData.forEach((newRow) => {
    console.log(
      `Name: ${newRow[0]} | Index: ${existingData.findIndex((row) => row[0] === newRow[0])}`
    );
    const existingRowIdx = existingData.findIndex(
      (row) => row[0] === newRow[0]
    ); // Find by name
    if (existingRowIdx >= 0) {
      updateRows.push({
        range: `Sheet1!A${existingRowIdx + 1}`,
        values: [newRow],
      });
    } else {
      appendRows.push(newRow);
    }
  });

  return { updateRows, appendRows };
}

async function updateAndAppendData(
  sheets,
  spreadsheetId,
  updateRows,
  appendRows
) {
  // Update existing rows
  if (updateRows.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: "USER_ENTERED",
        data: updateRows,
      },
    });
  }

  // Append new rows
  if (appendRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: appendRows,
      },
    });
  }
}

function showAllData(scores) {
  rl.question("Show all gathered data? (Y/N) ", async (showAll) => {
    if (showAll.toLowerCase() === "y") {
      console.log("All gathered data:");
      console.table(scores);
    } else {
      console.log("Exiting program.");
    }
    rl.close();
  });
}
