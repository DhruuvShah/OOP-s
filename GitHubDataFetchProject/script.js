const form = document.getElementById("searchForm");
const input = document.getElementById("usernameInput");
const button = document.getElementById("fetchButton");
const status = document.getElementById("searchStatus");
const output = document.getElementById("output");

let pendingRequests = 0;

const numberFormatter = new Intl.NumberFormat("en", { notation: "compact" });

function formatCount(value) {
  return numberFormatter.format(value ?? 0);
}

function setLoading(isLoading) {
  button.disabled = isLoading;
  input.disabled = isLoading;
}

function setStatus(message, variant) {
  status.textContent = message;
  status.classList.toggle("status--error", variant === "error");
}

function buildSkeletonCard() {
  const skeleton = document.createElement("div");
  skeleton.className = "skeleton";
  skeleton.innerHTML = `
    <div class="skeleton__avatar"></div>
    <div class="skeleton__line skeleton__line--title"></div>
    <div class="skeleton__line skeleton__line--sub"></div>
    <div class="skeleton__line skeleton__line--block"></div>
    <div class="skeleton__line skeleton__line--block"></div>
  `;
  return skeleton;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(response.status === 404 ? "User not found" : "GitHub API request failed");
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function getUserInfo(username) {
  const [user, repos] = await Promise.all([
    fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}`),
    fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=5`),
  ]);

  return { user, repos: Array.isArray(repos) ? repos : [] };
}

function buildStat(value, label) {
  const stat = document.createElement("div");
  stat.className = "stat";

  const valueEl = document.createElement("span");
  valueEl.className = "stat__value";
  valueEl.textContent = formatCount(value);

  const labelEl = document.createElement("span");
  labelEl.className = "stat__label";
  labelEl.textContent = label;

  stat.append(valueEl, labelEl);
  return stat;
}

function buildRepoItem(repo) {
  const item = document.createElement("li");
  item.className = "repo";

  const link = document.createElement("a");
  link.className = "repo__name";
  link.href = repo.html_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = repo.name;

  const meta = document.createElement("span");
  meta.className = "repo__meta";
  const language = repo.language ? `${repo.language} · ` : "";
  meta.textContent = `${language}★ ${formatCount(repo.stargazers_count)}`;

  item.append(link, meta);
  return item;
}

function createUserCard(user, repos) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.login = user.login.toLowerCase();

  const avatar = document.createElement("img");
  avatar.className = "card__avatar";
  avatar.src = user.avatar_url;
  avatar.alt = `${user.login}'s avatar`;
  avatar.loading = "lazy";

  const name = document.createElement("h2");
  name.className = "card__name";
  name.textContent = user.name || user.login;

  const login = document.createElement("a");
  login.className = "card__login";
  login.href = user.html_url;
  login.target = "_blank";
  login.rel = "noopener noreferrer";
  login.textContent = `@${user.login}`;

  card.append(avatar, name, login);

  if (user.bio) {
    const bio = document.createElement("p");
    bio.className = "card__bio";
    bio.textContent = user.bio;
    card.append(bio);
  }

  const stats = document.createElement("div");
  stats.className = "card__stats";
  stats.append(
    buildStat(user.public_repos, "Repos"),
    buildStat(user.followers, "Followers"),
    buildStat(user.following, "Following"),
  );
  card.append(stats);

  const sectionTitle = document.createElement("p");
  sectionTitle.className = "card__section-title";
  sectionTitle.textContent = "Recently Updated Repositories";
  card.append(sectionTitle);

  if (repos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "repo-list__empty";
    empty.textContent = "This user has no public repositories yet.";
    card.append(empty);
  } else {
    const list = document.createElement("ul");
    list.className = "repo-list";
    repos.forEach((repo) => list.append(buildRepoItem(repo)));
    card.append(list);
  }

  return card;
}

async function handleSearch(rawUsername) {
  const username = rawUsername.trim();
  if (!username) {
    setStatus("Enter a GitHub username to search.", "error");
    input.focus();
    return;
  }

  pendingRequests += 1;
  setLoading(true);
  setStatus(`Searching for "${username}"…`);

  const skeleton = buildSkeletonCard();
  output.prepend(skeleton);

  try {
    const { user, repos } = await getUserInfo(username);

    const existing = output.querySelector(`[data-login="${user.login.toLowerCase()}"]`);
    if (existing) existing.remove();

    skeleton.replaceWith(createUserCard(user, repos));
    setStatus(`Showing results for "${user.login}".`);
  } catch (err) {
    skeleton.remove();

    const message =
      err.status === 404
        ? `We couldn't find a GitHub user named "${username}".`
        : "Something went wrong while reaching the GitHub API. Please try again in a moment.";

    setStatus(message, "error");
  } finally {
    pendingRequests -= 1;
    if (pendingRequests === 0) setLoading(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  handleSearch(input.value);
});
