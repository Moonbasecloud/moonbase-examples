// The event this page is for. Change these values to make it your own event.
// They are example data: the observatory and its party are made up. The date
// is a real full moon (18 July 2027).
const EVENT = {
  title: "Full Moon Night",
  tagline: "A stargazing party at the Moonbase Observatory",
  host: "The Moonbase Observatory",
  date: "Sunday, 18 July 2027",
  time: "20:30 to 23:30",
  place: "Moonbase Observatory, Hilltop Road",
  bring: "A warm jacket and a blanket. Telescopes are provided.",
  about:
    "The full moon rises over the hill just after sunset. Look at its craters through our " +
    "telescopes, find the summer constellations with a guide, and stay for hot chocolate on " +
    "the lawn. If the sky is cloudy, we move inside the dome for a short talk.",
};

// The largest party one RSVP can bring, the guest included.
const MAX_PARTY = 6;

// Step 2 ("Add a snack choice for each guest"): the snacks each guest picks
// from. The id is what the database stores; the label is what people see.
// They are kept in the meals column, the name the database already uses.
const MEALS = [
  { id: "cheese", label: "Moon cheese plate" },
  { id: "cupcakes", label: "Galaxy cupcakes" },
  { id: "popcorn", label: "Comet popcorn" },
];

module.exports = { EVENT, MAX_PARTY, MEALS };
