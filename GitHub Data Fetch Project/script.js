async function getUserInfo(username) {
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error("User not found");
    const userData = await userRes.json();
  
    const repoRes = await fetch(`https://api.github.com/users/${username}/repos?sort=created&per_page=3`);
    const repos = await repoRes.json();
  
    return { userData, repos };
  }
  
  function createUserCard(user, repos) {
    const card = document.createElement('div');
    card.className = 'card';
  
    card.innerHTML = `
      <img src="${user.avatar_url}" alt="Avatar" class="avatar" />
      <h2>${user.login}</h2>
      <p>Public Repos: ${user.public_repos}</p>
      <p>Followers: ${user.followers} | Following: ${user.following}</p>
      <h4>Latest Repositories:</h4>
      <ul>
        ${repos.map(repo => `<li><a href="${repo.html_url}" target="_blank">${repo.name}</a></li>`).join('')}
      </ul>
    `;
  
    return card;
  }
  
  document.getElementById('fetchButton').addEventListener('click', async () => {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) return;
  
    try {
      const { userData, repos } = await getUserInfo(username);
      const card = createUserCard(userData, repos);
      document.getElementById('output').appendChild(card);
    } catch (err) {
      alert("User not found or error fetching data");
    }
  });
  

    