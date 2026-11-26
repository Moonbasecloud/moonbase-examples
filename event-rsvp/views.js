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

function layout(title, body, { pageClass = "" } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Inter:wght@400;500;600&amp;display=swap">
  <link rel="stylesheet" href="/style.css">
</head>
<body${pageClass ? ` class="${pageClass}"` : ""}>
  <div class="sky" aria-hidden="true"></div>
  <main>
${body}
    <footer>An example app hosted on <a href="${SITE}">moonbase</a>.</footer>
  </main>
  <script src="/form.js"></script>
</body>
</html>`;
}

// The top of every page: the moon, who invites, the title and the tagline.
// The moon is public/moon.svg, a separate file, so it is easy to replace.
function hero({ kicker = `${EVENT.host} invites you`, small = false } = {}) {
  return `    <header class="hero${small ? " hero-small" : ""}">
      <img class="moon" src="/moon.svg" alt="" width="200" height="200">
      <p class="kicker">${escapeHtml(kicker)}</p>
      <h1>${escapeHtml(EVENT.title)}</h1>
      <p class="tagline">${escapeHtml(EVENT.tagline)}</p>
    </header>`;
}

function eventDetails() {
  return `${hero()}
    <dl class="facts">
      <div class="fact"><dt>When</dt><dd>${escapeHtml(EVENT.date)}<br>${escapeHtml(EVENT.time)}</dd></div>
      <div class="fact"><dt>Where</dt><dd>${escapeHtml(EVENT.place)}</dd></div>
      <div class="fact"><dt>What to bring</dt><dd>${escapeHtml(EVENT.bring)}</dd></div>
    </dl>
    <p class="lead">${escapeHtml(EVENT.about)}</p>`;
}

function eventPage({ error = "", values = {} } = {}) {
  const party = Number(values.party_size) || 1;
  const partyOptions = Array.from({ length: MAX_PARTY }, (_, i) => i + 1)
    .map(
      (n) => `<label class="choice count"><input type="radio" name="party_size" value="${n}"${n === party ? " checked" : ""}><span>${n}</span></label>`,
    )
    .join("\n          ");

  // Step 2 ("Add a snack choice for each guest"): one snack choice per person.
  // Without JavaScript all of them show; form.js shows only as many as the
  // party has, and the server reads only that many.
  const mealFields = Array.from({ length: MAX_PARTY }, (_, i) => {
    const n = i + 1;
    const chosen = values[`meal_${n}`];
    const options = MEALS.map(
      (meal) =>
        `<label class="choice"><input type="radio" name="meal_${n}" value="${meal.id}"${meal.id === chosen ? " checked" : ""}><span>${escapeHtml(meal.label)}</span></label>`,
    ).join("\n            ");
    return `        <fieldset class="meal" data-guest="${n}">
          <legend>${n === 1 ? "Your snack" : `Snack for guest ${n}`}</legend>
          <div class="choices">
            ${options}
          </div>
        </fieldset>`;
  }).join("\n");

  return layout(
    `${EVENT.title}: ${EVENT.tagline}`,
    `${eventDetails()}

    <form method="post" action="/rsvp" id="rsvp" class="panel">
      <h2>RSVP</h2>
      ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}
      <div class="field">
        <label for="name">Your name</label>
        <input id="name" name="name" maxlength="80" required autocomplete="name" value="${escapeHtml(values.name)}">
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" maxlength="254" required autocomplete="email" value="${escapeHtml(values.email)}">
      </div>
      <fieldset class="field">
        <legend>Number of guests, you included</legend>
        <div class="choices counts">
          ${partyOptions}
        </div>
      </fieldset>
      <fieldset class="field meals-group">
        <legend>A snack for each guest</legend>
${mealFields}
      </fieldset>
      <button type="submit">Send my RSVP</button>
      <p class="hint">Plans changed? Send the form again with the same email and your RSVP is updated.</p>
    </form>`,
  );
}

function confirmationPage(guest) {
  const people = guest.party_size === 1 ? "1 guest" : `${guest.party_size} guests`;
  // Step 2: the confirmation repeats the snack choices.
  const meals = (guest.meals || [])
    .map((id, i) => `<li><span>${i === 0 ? "You" : `Guest ${i + 1}`}</span><strong>${escapeHtml(mealLabel(id))}</strong></li>`)
    .join("");
  return layout(
    `You're on the list: ${EVENT.title}`,
    `${eventDetails()}

    <section class="panel confirm" role="status">
      <h2>Thank you, ${escapeHtml(guest.name)}. You're on the list.</h2>
      <p>We saved your RSVP for ${people} under ${escapeHtml(guest.email)}.</p>
      ${meals ? `<ul class="rows">${meals}</ul>` : ""}
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
      `${hero({ kicker: "Owner view", small: true })}
    <form method="post" action="/owner" class="panel">
      ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}
      <div class="field">
        <label for="key">Owner key</label>
        <input id="key" name="key" type="password" required autocomplete="current-password">
      </div>
      <button type="submit">Show the guest list</button>
      <p class="hint">The owner key is the value of the OWNER_KEY environment variable of this project.</p>
    </form>`,
      { pageClass: "owner" },
    ),
  };
}

function ownerOffPage() {
  return layout(
    `Owner view: ${EVENT.title}`,
    `${hero({ kicker: "Owner view", small: true })}
    <section class="panel">
      <h2>The owner view is off</h2>
      <p>Set the OWNER_KEY environment variable of this project to a value of at least 12 characters, then deploy again. The README explains how.</p>
    </section>`,
    { pageClass: "owner" },
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

  // Step 2: totals per snack, so the owner knows what to prepare.
  const totals = MEALS.map(
    (meal) => `<li><span>${escapeHtml(meal.label)}</span><strong>${mealTotals[meal.id] || 0}</strong></li>`,
  ).join("");

  return layout(
    `Owner view: ${EVENT.title}`,
    `${hero({ kicker: "Owner view", small: true })}
    <div class="stats">
      <div class="panel stat"><span class="big">${headcount}</span> ${headcount === 1 ? "person" : "people"} coming</div>
      <div class="panel stat"><span class="big">${rsvps}</span> ${rsvps === 1 ? "RSVP" : "RSVPs"}</div>
    </div>

    <section class="panel">
      <h2>Snacks to prepare</h2>
      <ul class="rows">${totals}<li><span>Not chosen yet</span><strong>${notChosen}</strong></li></ul>
    </section>

    <section class="panel">
      <h2>Guest list</h2>
      ${
        guests.length === 0
          ? "<p class=\"muted\">No RSVPs yet.</p>"
          : `<div class="table"><table>
        <thead><tr><th>Name</th><th>Email</th><th class="num">Guests</th><th>Snacks</th><th>Last updated</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table></div>`
      }
    </section>`,
    { pageClass: "owner" },
  );
}

module.exports = { eventPage, confirmationPage, ownerLoginPage, ownerOffPage, ownerPage, escapeHtml };
