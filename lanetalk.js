const puppeteer = require("puppeteer");
const readline = require("readline");
const { spawn } = require("child_process");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const namesToFind = ["Kiki", "Kristen", "Eric", "Susan", "Kellie"];

(async () => {
  const scores = await scrapeData();

  const matchedScores = scores.filter((player) =>
    namesToFind.some((nameToFind) =>
      player.name.toLowerCase().includes(nameToFind.toLowerCase())
    )
  );

  const namesAndScores = matchedScores.map(
    (player) => `${player.name} (${player.team}): ${player.scores}`
  );

  const confirmation = await askForConfirmation(namesAndScores);

  if (confirmation === "y") {
    console.log("Confirmed. Pushing to Google Sheets...");
    await pushToGoogleSheets(matchedScores);
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
      return {
        name,
        team,
        scores,
      };
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
  // Code to push to Google Sheets goes here
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
