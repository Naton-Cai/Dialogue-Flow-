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

const MovieList = [
  "the super mario galaxy movie",
  "project hail mary",
  "hoppers",
  "wuthering heights",
  "scream seven",
  "goat",
  "the legend of aang",
  "passenger",
  "runner",
  "mutiny",
  "the furious",
  "twenty eight years later, the bone temple",
  "the odyssey",
  "avengers doomsday",
  "the mandalorian and grogu",
  "toy story five",
  "spider-man brand new day",
  "minions three",
  "michael",
  "moana"
];

const TheaterList = [
  "regal edwards portland",
  "cinemark century eastport plaza",
  "alamo drafthouse cinema",
  "amc metreon sixteen",
  "regal la live",
  "cinemark tinseltown usa",
  "harkins theatres scottsdale one hundred one",
  "marcus hollywood cinema",
  "showcase cinema de lux legacy place",
  "landmark theatres sunshine cinema",
  "arclight hollywood",
  "ipic theaters fulton market",
  "cinépolis luxury cinemas",
  "galaxy theatres boulevard mall",
  "studio movie grill",
  "b and b theatres liberty cinema",
  "megaplex theatres jordan commons",
  "cobb theatres dolphin nineteen",
  "malco paradiso cinema grill"
];

//used LLMs to pregenerate these movie objects
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
    text ? String(text).toLowerCase().trim() : "";

 
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
  const MovieTheater = normalize(parameters.TheaterName[0]["business-name"]);

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
        agent.add(`The closest Movie Theater playing ${matchedMovie.item} is ${TheaterForMovies.get(matchedMovie.item)[0]}`);
        // store the movie and theater list in context for the follow up intent
        agent.context.set({
          name: 'theater_suggestion',
          lifespan: 5,
          parameters: {
            movie: matchedMovie.item,
            index: 1
          }
        });
      }
    } else {
      agent.add(`I'm sorry but ${MovieTheater} does not match any theater in our database.`);
      agent.add(`The closest Movie Theater playing ${matchedMovie.item} is ${TheaterForMovies.get(matchedMovie.item)[0]}`);
        agent.context.set({
          name: 'theater_suggestion',
          lifespan: 5,
          parameters: {
            movie: matchedMovie.item,
            index: 1
          }
        });
    }
  } else {
    agent.add(`I'm sorry but ${MovieName} does not match any movie in our database.`);
  }
}

function GetClosestTheater(agent) {
  const parameters = request.body.queryResult.parameters;
  const context = agent.context.get('theater_suggestion');
  const MovieName = normalize(parameters.MovieName);
  const matchedMovie = search(MovieName, MovieList, { returnMatchData: true })[0];

  //if a new movie is prompted or the context is empty, we have to fill the context with a new movie
if (MovieName) {
  if (matchedMovie === undefined || parseFloat(matchedMovie.score) <= 0.6) {
    agent.add(`I'm sorry but ${MovieName} does not match any movie in our database.`);
    return;
  }

  // only reset if a different movie was requested
  agent.add(`The closest Movie Theater playing ${matchedMovie.item} is ${TheaterForMovies.get(matchedMovie.item)[0]}`);
  if (!context || matchedMovie.item !== context.parameters.movie) {
    agent.context.set({
    name: 'theater_suggestion',
    lifespan: 5,
    parameters: {
      movie: matchedMovie.item,
      index: 1
    }
    });
    return;
  }
}

if (!context) {
  agent.add(`I'm sorry but you haven't provided a Movie. Try saying a movie you would like to watch.`);
  return;
}
  //if we do have the context we can iterate through the movie list to find the closest theater
  else{
    const { movie, index } = context.parameters;
    const theaters = TheaterForMovies.get(movie);

    if (index >= theaters.length) {
      agent.add(`Sorry, there are no more theaters playing ${movie}.`);
      agent.context.delete('theater_suggestion');
      return;
    }
    agent.context.set({
      name: 'theater_suggestion',
      lifespan: 5,
      parameters: { movie, index: index + 1 }
    });
    
    if (index + 1 >= theaters.length) {
      agent.add(`The last theater playing ${movie} is ${theaters[index]}.`);
    } else {
      agent.add(`${theaters[index]} is playing ${movie}. Would you like to hear another suggestion?`);
    }
  }
  
}


  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('MovieTheaterMatch Intent', MovieTheaterMatch);
  intentMap.set('GetClosestTheater Intent', GetClosestTheater);
  agent.handleRequest(intentMap);
});