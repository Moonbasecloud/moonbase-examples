// Step 2 ("Add a snack choice for each guest"): show one snack choice for each
// person in the party. Hidden choices are disabled, so they are not sent.
// Without JavaScript every choice shows, and the server reads only as many as
// the party has.
(function () {
  const counts = document.querySelectorAll('input[name="party_size"]');
  if (counts.length === 0) return;
  function partySize() {
    const checked = document.querySelector('input[name="party_size"]:checked');
    return Number(checked && checked.value) || 1;
  }
  function update() {
    const size = partySize();
    document.querySelectorAll(".meal").forEach(function (field) {
      const show = Number(field.dataset.guest) <= size;
      field.hidden = !show;
      field.disabled = !show;
      field.querySelectorAll("input").forEach(function (input) {
        input.required = show;
      });
    });
  }
  counts.forEach(function (input) {
    input.addEventListener("change", update);
  });
  update();
})();
