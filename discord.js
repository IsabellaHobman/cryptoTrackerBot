const { Client, MessageEmbed } = require('discord.js');
const config = require('./config.json');
const client = new Client();
const fs = require('fs').promises;
const prefix = config.prefix;
const fetch = require('node-fetch');
let btcFlagged = false;
let updatedFlagged = false;
const apiPath = 'https://api.coingecko.com/api/v3/coins/';


client.once('ready', () => {
console.log("should be on");

});

client.on('message', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return
	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();
  switch(command){
case "btc":
retriveSpot(message);
let testMessage = message;
if (!btcFlagged) {
  btcFlagged = true;
  setInterval(retriveSpot, 3.6e+6, testMessage);
}
break;
case "update": //
printPrice(message);
let updateMessage = message;
if (!updatedFlagged)
{
  updatedFlagged = true;
  setInterval(printPrice, 1.8e+6, updateMessage);
  // 1.8e+6
}
break;
case "find":
const test = message.content.split(' ');
const finished = [];
for (var i = 1; i < test.length; i++) {
  finished.push(apiPath.concat(test[i]));
   // create an array, then concat the coins onto the end of the string
   // this is so that each one can be searched for
}
var passedMessage = message;
searchCoin(passedMessage, finished, true);
break;
case "pricealert":
const beforeCoin = message.content.split(' ');
const coin = beforeCoin[1].toLowerCase();
const price = beforeCoin[2];
const userID = message.author.id;
let pricePath = [];
pricePath.push(apiPath.concat(coin));
message.channel.send("Got it. Will alert <@" + userID + "> when " + coin + " is at " + price + " or higher");
setInterval(priceAlerter, 6000, message, pricePath, price, userID);
break;
case "help":
message.channel.send("!find gives you the price of any cryptocurrency, or returns an error if it doesn't exist. \n !pricealert sets a price for a cryptocurrency, then alerts you if your price is met.");
break;
}
});
async function searchCoin(message, coin, print)  {
  for (const item of coin) {
  let testing = await fetch(item).then(resp => resp.json());
  if(!testing.hasOwnProperty('error') && print){
    message.channel.send("The price of " + testing.name + " is " + testing.market_data.current_price.usd + " USD" + " , or "
    + testing.market_data.current_price.gbp + " GBP." );

}
else if (!testing.hasOwnProperty('error') && !print) {
 return testing;
}
else{
  message.channel.send(testing.error);
}
}
}
async function updatePricesButCooler() {
  const eth = await  fetch('https://api.coingecko.com/api/v3/coins/ethereum').then(resp => resp.json());
  const btc = await  fetch('https://api.coingecko.com/api/v3/coins/bitcoin').then(resp => resp.json());
  return [eth, btc];
}
async function retriveSpot(message) {
  var { data } = await fetch('https://api.coinbase.com/v2/prices/spot?currency=GBP').then(resp => resp.json());
  let spotPrice = parseFloat(data.amount).toFixed(3);
  const unbuffedpreviousPrice = await fs.readFile("btc.txt", "utf8");
  let previousPrice = parseFloat(unbuffedpreviousPrice).toFixed(3);
  if(spotPrice > previousPrice ) {
    message.channel.send("The spot price of BTC is currently: "  + spotPrice + " " + data.currency + ", an increase of " + getPercent(previousPrice, spotPrice) + "% from its previous price of " + previousPrice + " " + data.currency + ".");
  }
  else if (spotPrice <  previousPrice) {
  message.channel.send("The spot price of BTC is currently: "  + spotPrice + " " + data.currency + ", a decrease of " + getPercent(previousPrice, spotPrice) +  "% from its previous price of " + previousPrice + " " + data.currency + ".");
  }
  else {
    message.channel.send("The spot price of BTC is currently: "  + spotPrice + " " + data.currency + ", which is not an increase at all, please leave me alone.  ");
  }
  const jsonInvestors = await fs.readFile('investors.json', 'utf8');
  const investors = JSON.parse(jsonInvestors);
 for (i = 0; i < 3; i++) {
   if(spotPrice > investors.investors[i].buyout) {
  message.channel.send("<@" + investors.investors[i].name + "> your sell price has been met! Congrats.");

else if (spotPrice < investors.investors[i].sellout) {
 message.channel.send("<@" + investors.investors[i].name + "> your buy price has been met!");
}
}
  fs.writeFile('btc.txt', spotPrice.toString(), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
  });
}
 function getPercent(intialValue, newValue) {
  let value =  newValue - intialValue;
  return ((value / intialValue) * 100).toFixed(3);
}
async function priceAlerter(message, path, price, userID) {
  const data = await searchCoin(message, path);
  if (parseFloat(data.market_data.current_price.gbp) >= price) {
    let coinName = path.toString().split('/')
    console.log(path)
    message.channel.send("<@" + userID + ">, your price alert for " + coinName[6] + " has been met!" );
  }

}
async function printPrice(message){
  const priceArray = await updatePricesButCooler();
  for (i = 0; i < priceArray.length; i++) {
    message.channel.send("The price of " + priceArray[i].name + " is " + priceArray[i].market_data.current_price.usd + " USD" + " , or "
  + priceArray[i].market_data.current_price.gbp + " GBP." );
  }
}
client.login(config.token);
