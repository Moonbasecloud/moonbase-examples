// Step 2 ("Add a meal choice for each guest"): show one meal choice for each
// person in the party. Hidden choices are disabled, so they are not sent.
// Without JavaScript every choice shows, and the server reads only as many as
// the party has.
(function () {
  const party = document.getElementById("party_size");
  if (!party) return;
  function update() {
    const size = Number(party.value) || 1;
    document.querySelectorAll(".meal").forEach(function (field) {
      const show = Number(field.dataset.guest) <= size;
      field.hidden = !show;
      const select = field.querySelector("select");
      select.disabled = !show;
      select.required = show;
    });
  }
  party.addEventListener("change", update);
  update();
})();
