//an import statement into the script
const puppeteer = require('puppeteer');

// an asynchronous function is something that returns a promise that can be awaited
(async () => {
    //launch up the browser
    const browser = await puppeteer.launch();

    //opening a new tab in the browser
    const page = await browser.newPage();

    //save the url as a new variable
    url = 'https://beta.lanetalk.com/bowlingcenters/367895d6-d3f2-4d89-b4a6-9f11ea7af700/completed'

    //navigate to the URL and wait until the page loads
    //await means wait for the operation to complete
    //'networkidle0' sits there until there are no more than 0 network connections for 500ms
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    //the element in the HTMl to pull from that I want
    element = '.player.ng-star-inserted';
    //wait till the element we want is loaded
    await page.waitForSelector(element);

    // the scores will execute the function and returns a Promise
    const scores = await page.evaluate(() => {
    
        // select all the elements within the class and convert the NodeList into an array
        // ...for easy manipulation within JavaScript like 'map'
        const players = Array.from(document.querySelectorAll('.player.ng-star-inserted'));
        // iterate over each player element in the array
        return players.map(player => {
            // get the element of the name within the player element
            const text = player.querySelector('.nameAndDate > .name').innerText;

            // split the text because of the null character
            const [name, team] = text.split('\n');

            // these contain the order of the scores starting with '0' for the 1st game
            const scoreElements = player.querySelectorAll('.numbersWrapper > .numberBatch');
            // convert the NodeList into an array with the scores
            const scores = Array.from(scoreElements).map(el => el.innerText);

            // contains the total score from the website
            // !!! THIS WILL SOON BE CHANGED TO FIRST TWO GAMES FOR BOWLING CLUB !!!
            const totalScore = player.querySelector('.totalScore > .score').innerText;

            // return all of the content gathered
            return { name, team, scores, totalScore };
    });
  });
    //the console is placing the scores in the terminal 
    console.log(scores);

    //close the browser to finish
    await browser.close();
})();
