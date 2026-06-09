import fetch from "node-fetch";

export async function getActivityFeed() {
   const response = await fetch("https://api.github.com/repos/cu-sanjay/Stylish-Readme/events");
   const data = await response.json();

  return data.slice(0, 5).map(event => ({
    type: event.type,
    user: event.actor.login,
    repo: event.repo.name
  }));
}
