// The HTML pages, rendered on the server. Every value that came from a visitor
// or from the database goes through escapeHtml, so it is shown as text and
// never read as HTML.
const { EVENT, MAX_PARTY, MEALS } = require("./event");

const SITE = "https://moonbase.cloud/?utm_source=github&amp;utm_medium=moonbase-examples&amp;utm_campaign=gh-launch";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mealLabel(id) {
  return MEALS.find((meal) => meal.id === id)?.label ?? id;
}

function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main>
${body}
    <footer>An example app hosted on <a href="${SITE}">moonbase</a>.</footer>
  </main>
  <script src="/form.js"></script>
</body>
</html>`;
}

function eventDetails() {
  return `    <p class="kicker">${escapeHtml(EVENT.host)} invites you</p>
    <h1>${escapeHtml(EVENT.title)}</h1>
    <dl class="facts">
      <div><dt>When</dt><dd>${escapeHtml(EVENT.date)}, ${escapeHtml(EVENT.time)}</dd></div>
      <div><dt>Where</dt><dd>${escapeHtml(EVENT.place)}</dd></div>
    </dl>
    <p class="lead">${escapeHtml(EVENT.about)}</p>`;
}

function eventPage({ error = "", values = {} } = {}) {
  const party = Number(values.party_size) || 1;
  const partyOptions = Array.from({ length: MAX_PARTY }, (_, i) => i + 1)
    .map((n) => `<option value="${n}"${n === party ? " selected" : ""}>${n}</option>`)
    .join("");

  // Step 2 ("Add a meal choice for each guest"): one meal choice per person.
  // Without JavaScript all of them show; form.js shows only as many as the
  // party has, and the server reads only that many.
  const mealFields = Array.from({ length: MAX_PARTY }, (_, i) => {
    const n = i + 1;
    const chosen = values[`meal_${n}`];
    const options = MEALS.map(
      (meal) => `<option value="${meal.id}"${meal.id === chosen ? " selected" : ""}>${escapeHtml(meal.label)}</option>`,
    ).join("");
    return `        <div class="meal" data-guest="${n}">
          <label for="meal_${n}">${n === 1 ? "Your meal" : `Meal for guest ${n}`}</label>
          <select id="meal_${n}" name="meal_${n}"><option value="">Choose a meal</option>${options}</select>
        </div>`;
  }).join("\n");

  return layout(
    EVENT.title,
    `${eventDetails()}

    <form method="post" action="/rsvp" id="rsvp">
      <h2>RSVP</h2>
      ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}
      <label for="name">Your name</label>
      <input id="name" name="name" maxlength="80" required autocomplete="name" value="${escapeHtml(values.name)}">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" maxlength="254" required autocomplete="email" value="${escapeHtml(values.email)}">
      <label for="party_size">Number of guests, you included</label>
      <select id="party_size" name="party_size">${partyOptions}</select>
      <fieldset>
        <legend>Meal for each guest</legend>
${mealFields}
      </fieldset>
      <button type="submit">Send my RSVP</button>
      <p class="hint">Plans changed? Send the form again with the same email and your RSVP is updated.</p>
    </form>`,
  );
}

function confirmationPage(guest) {
  const people = guest.party_size === 1 ? "1 guest" : `${guest.party_size} guests`;
  // Step 2: the confirmation repeats the meal choices.
  const meals = (guest.meals || [])
    .map((id, i) => `<li>${i === 0 ? "You" : `Guest ${i + 1}`}: ${escapeHtml(mealLabel(id))}</li>`)
    .join("");
  return layout(
    `You're on the list: ${EVENT.title}`,
    `${eventDetails()}

    <section class="card confirm" role="status">
      <h2>Thank you, ${escapeHtml(guest.name)}. You're on the list.</h2>
      <p>We saved your RSVP for ${people} under ${escapeHtml(guest.email)}.</p>
      ${meals ? `<ul class="meals">${meals}</ul>` : ""}
      <p class="hint">No email is sent. To change your RSVP, send the form again with the same email.</p>
      <p><a href="/">Back to the event page</a></p>
    </section>`,
  );
}

function ownerLoginPage({ error = "", status = 200 } = {}) {
  return {
    status,
    html: layout(
      `Owner view: ${EVENT.title}`,
      `    <p class="kicker">Owner view</p>
    <h1>${escapeHtml(EVENT.title)}</h1>
    <form method="post" action="/owner">
      ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}
      <label for="key">Owner key</label>
      <input id="key" name="key" type="password" required autocomplete="current-password">
      <button type="submit">Show the guest list</button>
      <p class="hint">The owner key is the value of the OWNER_KEY environment variable of this project.</p>
    </form>`,
    ),
  };
}

function ownerOffPage() {
  return layout(
    `Owner view: ${EVENT.title}`,
    `    <p class="kicker">Owner view</p>
    <h1>${escapeHtml(EVENT.title)}</h1>
    <section class="card">
      <h2>The owner view is off</h2>
      <p>Set the OWNER_KEY environment variable of this project to a value of at least 12 characters, then deploy again. The README explains how.</p>
    </section>`,
  );
}

function ownerPage({ rsvps, headcount, guests, mealTotals, notChosen }) {
  const rows = guests
    .map(
      (guest) => `        <tr>
          <td>${escapeHtml(guest.name)}</td>
          <td>${escapeHtml(guest.email)}</td>
          <td class="num">${guest.party_size}</td>
          <td>${guest.meals ? escapeHtml(guest.meals.map(mealLabel).join(", ")) : "<span class=\"muted\">not chosen yet</span>"}</td>
          <td>${escapeHtml(new Date(guest.updated_at).toISOString().slice(0, 16).replace("T", " "))} UTC</td>
        </tr>`,
    )
    .join("\n");

  // Step 2: totals per meal, so the owner knows what to order.
  const totals = MEALS.map(
    (meal) => `<li><span>${escapeHtml(meal.label)}</span><strong>${mealTotals[meal.id] || 0}</strong></li>`,
  ).join("");

  return layout(
    `Owner view: ${EVENT.title}`,
    `    <p class="kicker">Owner view</p>
    <h1>${escapeHtml(EVENT.title)}</h1>
    <div class="stats">
      <div class="card"><span class="big">${headcount}</span> ${headcount === 1 ? "person" : "people"} coming</div>
      <div class="card"><span class="big">${rsvps}</span> ${rsvps === 1 ? "RSVP" : "RSVPs"}</div>
    </div>

    <section class="card">
      <h2>Meals to order</h2>
      <ul class="totals">${totals}<li><span>Not chosen yet</span><strong>${notChosen}</strong></li></ul>
    </section>

    <section class="card">
      <h2>Guest list</h2>
      ${
        guests.length === 0
          ? "<p>No RSVPs yet.</p>"
          : `<div class="table"><table>
        <thead><tr><th>Name</th><th>Email</th><th class="num">Guests</th><th>Meals</th><th>Last updated</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table></div>`
      }
    </section>`,
  );
}

module.exports = { eventPage, confirmationPage, ownerLoginPage, ownerOffPage, ownerPage, escapeHtml };
