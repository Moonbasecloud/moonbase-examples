// The event this page is for. Change these values to make it your own event.
// They are example data: Riverbend and its picnic are made up.
const EVENT = {
  title: "Riverbend Summer Picnic",
  host: "Riverbend",
  date: "Saturday, 17 July 2027",
  time: "12:00 to 16:00",
  place: "Riverbend Park, the lawn by the boathouse",
  about:
    "Bring a blanket and your appetite. There is food for everyone, lawn games for the kids " +
    "and live music in the afternoon. If it rains, we move into the boathouse.",
};

// The largest party one RSVP can bring, the guest included.
const MAX_PARTY = 6;

// Step 2 ("Add a meal choice for each guest"): the menu each guest picks from.
// The id is what the database stores; the label is what people see.
const MEALS = [
  { id: "chicken", label: "Grilled chicken" },
  { id: "veggie", label: "Veggie burger" },
  { id: "vegan", label: "Vegan salad bowl" },
];

module.exports = { EVENT, MAX_PARTY, MEALS };
