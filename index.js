// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {search} = require("fast-fuzzy");
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

const TheaterForMovies = new Map([
  ["the super mario galaxy movie", ["regal edwards portland", "cinemark century eastport plaza", "amc metreon sixteen"]],
  ["project hail mary", ["alamo drafthouse cinema", "regal la live", "cinemark tinseltown usa"]],
  ["hoppers", ["harkins theatres scottsdale one hundred one", "marcus hollywood cinema"]],
  ["wuthering heights", ["showcase cinema de lux legacy place", "landmark theatres sunshine cinema", "arclight hollywood"]],
  ["scream seven", ["ipic theaters fulton market", "cinépolis luxury cinemas"]],
  ["goat", ["galaxy theatres boulevard mall", "studio movie grill", "regal edwards portland"]],
  ["the legend of aang", ["b and b theatres liberty cinema", "megaplex theatres jordan commons"]],
  ["passenger", ["cobb theatres dolphin nineteen", "malco paradiso cinema grill", "alamo drafthouse cinema"]],
  ["runner", ["regal la live", "cinemark century eastport plaza"]],
  ["mutiny", ["marcus hollywood cinema", "harkins theatres scottsdale one hundred one", "ipic theaters fulton market"]],
  ["the furious", ["arclight hollywood", "showcase cinema de lux legacy place"]],
  ["twenty eight years later, the bone temple", ["cinépolis luxury cinemas", "galaxy theatres boulevard mall", "studio movie grill"]],
  ["the odyssey", ["megaplex theatres jordan commons", "b and b theatres liberty cinema"]],
  ["avengers doomsday", ["amc metreon sixteen", "regal edwards portland", "cinemark tinseltown usa"]],
  ["the mandalorian and grogu", ["malco paradiso cinema grill", "cobb theatres dolphin nineteen"]],
  ["toy story five", ["landmark theatres sunshine cinema", "arclight hollywood", "alamo drafthouse cinema"]],
  ["spider-man brand new day", ["regal la live", "ipic theaters fulton market"]],
  ["minions three", ["cinemark century eastport plaza", "marcus hollywood cinema", "galaxy theatres boulevard mall"]],
  ["michael", ["studio movie grill", "harkins theatres scottsdale one hundred one"]],
  ["moana", ["showcase cinema de lux legacy place", "megaplex theatres jordan commons", "b and b theatres liberty cinema"]],
]);

const TheaterwithMovies = new Map([
  ["regal edwards portland", ["the super mario galaxy movie", "goat", "avengers doomsday"]],
  ["cinemark century eastport plaza", ["the super mario galaxy movie", "runner", "minions three"]],
  ["alamo drafthouse cinema", ["project hail mary", "passenger", "toy story five"]],
  ["amc metreon sixteen", ["project hail mary", "avengers doomsday"]],
  ["regal la live", ["project hail mary", "runner", "spider-man brand new day"]],
  ["cinemark tinseltown usa", ["project hail mary", "avengers doomsday"]],
  ["harkins theatres scottsdale one hundred one", ["hoppers", "mutiny", "michael"]],
  ["marcus hollywood cinema", ["hoppers", "mutiny", "minions three"]],
  ["showcase cinema de lux legacy place", ["wuthering heights", "the furious", "moana"]],
  ["landmark theatres sunshine cinema", ["wuthering heights", "toy story five"]],
  ["arclight hollywood", ["wuthering heights", "the furious", "toy story five"]],
  ["ipic theaters fulton market", ["scream seven", "mutiny", "spider-man brand new day"]],
  ["cinépolis luxury cinemas", ["scream seven", "twenty eight years later, the bone temple"]],
  ["galaxy theatres boulevard mall", ["goat", "twenty eight years later, the bone temple", "minions three"]],
  ["studio movie grill", ["goat", "twenty eight years later, the bone temple", "michael"]],
  ["b and b theatres liberty cinema", ["the legend of aang", "the odyssey", "moana"]],
  ["megaplex theatres jordan commons", ["the legend of aang", "the odyssey", "moana"]],
  ["cobb theatres dolphin nineteen", ["passenger", "the mandalorian and grogu"]],
  ["malco paradiso cinema grill", ["passenger", "the mandalorian and grogu"]],
]);

  //our method to normalize text
  const normalize = (text) =>
    text.toLowerCase().trim();

 
  function welcome(agent) {
    agent.add(`ello`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function MovieTheaterMatch(agent) {
  const parameters = request.body.queryResult.parameters;
  const MovieName = normalize(parameters.MovieName);
  const MovieTheater = normalize(parameters.location["business-name"]);

  const matchedMovie = search(MovieName, MovieList, { returnMatchData: true })[0];
  const matchedTheater = search(MovieTheater, TheaterList, { returnMatchData: true })[0];

  if (matchedMovie === undefined) {
    agent.add(`I'm sorry but ${MovieName} does not match any movie in our database.`);
    return;
  }

  if (matchedTheater === undefined) {
    agent.add(`I'm sorry but ${MovieTheater} does not match any theater in our database.`);
    return;
  }

  if (parseFloat(matchedMovie.score) > 0.6) {
    if (parseFloat(matchedTheater.score) > 0.6) {
      if (TheaterForMovies.get(matchedMovie.item).includes(matchedTheater.item)) {
        agent.add(`You can watch ${matchedMovie.item} at ${matchedTheater.item}`);
      } else {
        agent.add(`I'm sorry but ${matchedTheater.item} is not playing ${matchedMovie.item}.`);
      }
    } else {
      agent.add(`I'm sorry but ${MovieTheater} does not match any theater in our database.`);
    }
  } else {
    agent.add(`I'm sorry but ${MovieName} does not match any movie in our database.`);
  }
}

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('MovieTheaterMatch Intent', MovieTheaterMatch);
  agent.handleRequest(intentMap);
});