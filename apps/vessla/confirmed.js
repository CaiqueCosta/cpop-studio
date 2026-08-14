(function () {
  var titleEl = document.querySelector("[data-auth-title]");
  var ledeEl = document.querySelector("[data-auth-lede]");
  var noteEl = document.querySelector("[data-auth-note]");
  var openEl = document.querySelector("[data-auth-open]");
  if (!titleEl || !ledeEl || !noteEl || !openEl) return;

  var params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  var query = new URLSearchParams(window.location.search);
  var type = (params.get("type") || query.get("type") || "signup").toLowerCase();
  var error = query.get("error_description") || query.get("error") || params.get("error_description");
  var hash = window.location.hash;

  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, "", window.location.pathname);
  }

  if (error) {
    document.title = "Link expired — Vessla";
    titleEl.textContent = "Link expired";
    ledeEl.textContent = "This confirmation link is invalid or has already been used. Open Vessla and request a new one.";
    noteEl.textContent = "If you already confirmed this email, just sign in.";
    return;
  }

  if (type === "recovery") {
    document.title = "Reset your password — Vessla";
    titleEl.textContent = "You're verified";
    ledeEl.textContent = "Open Vessla to choose a new password. If the app does not open, return to it from your home screen.";
    noteEl.textContent = "This page can be closed once Vessla is open.";
    openEl.href = "com.caiquecosta.vessla://reset-password" + hash;
    return;
  }

  if (type === "email_change") {
    document.title = "Email updated — Vessla";
    titleEl.textContent = "Email updated";
    ledeEl.textContent = "Congratulations — your new email is authenticated. Open Vessla and sign in with that address.";
  }
})();
