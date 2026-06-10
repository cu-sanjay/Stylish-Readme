<div align="center">

<img src="./favicon.svg" width="96" alt="Stylish Readme Logo" />

# Stylish Readme

### Style your README with beautiful, dynamic SVG widgets

Dynamic SVG widgets for GitHub profiles, README files, portfolio pages, and documentation.

No API keys. No client-side JavaScript. No complicated setup.

<p>
  <img src="https://img.shields.io/badge/Production_Ready-Yes-success?style=for-the-badge" alt="Production Ready" />
  <img src="https://img.shields.io/badge/Serverless-Native-blue?style=for-the-badge" alt="Serverless" />
  <img src="https://img.shields.io/badge/Built_with-SVG-orange?style=for-the-badge" alt="SVG" />
  <img src="https://img.shields.io/badge/Themes-8-purple?style=for-the-badge" alt="Themes" />
</p>

</div>

> [!IMPORTANT]
>
> ## ⭐ Fork • Build • Contribute
>
> Before opening your first contribution:
>
> * ⭐ Star this repository
> * 🍴 Fork the repository
> * 🚀 Start building
> * 💡 Submit your improvements
>
> Every contribution, big or small, is appreciated.

## Overview

Stylish Readme renders widgets as standalone SVG images. Since GitHub supports SVG rendering natively inside Markdown image tags, widgets update automatically whenever your profile or README is viewed.

<table>
  <tr>
    <td align="center">
      <img src="https://img.icons8.com/fluency/30/resume.png" alt="Profile Icon"/><br>
      <strong>Profile Cards</strong><br>
      Developer identity
    </td>
    <td align="center">
      <img src="https://img.icons8.com/fluency/30/music.png" alt="Music Icon"/><br>
      <strong>Now Playing</strong><br>
      Music status
    </td>
    <td align="center">
      <img src="https://img.icons8.com/fluency/30/clock.png" alt="Clock Icon"/><br>
      <strong>Live Time</strong><br>
      Real-time clocks
    </td>
    <td align="center">
      <img src="https://img.icons8.com/fluency/30/fire-element.png" alt="Streak Icon"/><br>
      <strong>Streaks</strong><br>
      Activity tracking
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://img.icons8.com/fluency/30/youtube-play.png" alt="YouTube Icon"/><br>
      <strong>YouTube</strong><br>
      Video showcase
    </td>
    <td align="center">
      <img src="https://img.icons8.com/fluency/30/cloud.png" alt="Weather Icon"/><br>
      <strong>Weather</strong><br>
      Live conditions
    </td>
    <td align="center">
      <img src="https://img.icons8.com/fluency/30/timer.png" alt="Countdown Icon"/><br>
      <strong>Countdown</strong><br>
      Event tracking
    </td>
    <td align="center">
      <img src="https://img.icons8.com/fluency/30/highlighter.png" alt="Marker Icon"/><br>
      <strong>Marker Board</strong><br>
      Sketched bios
    </td>
  </tr>
</table>

## Features

* Dynamic SVG widgets
* Works directly inside GitHub README files
* Lightweight and fast
* No API keys required
* Fully customizable through URL parameters
* Multiple built-in themes
* Serverless-first architecture
* Easy self-hosting

## Widget Documentation & Examples

Copy any snippet below into your README and customize the query parameters to match your profile.

### 1. Developer Profile Card

Combines your avatar, role, bio, skills, and handle into a clean profile header.

#### Theme: Paper | Sharp edges (`radius=0`)

```md
![Profile Card](https://readmeme.eu.cc/api/profile.svg?avatar=https%3A%2F%2Fgithub.com%2Fcu-sanjay.png&name=Sanjay&role=Full-Stack+Developer&bio=Building+cool+things+with+code+n+coffee.&skills=HTML%2CJS%2CREACT%2CNODE%2CPYTHON%2CGIT%2CSQL&handle=cu-sanjay&theme=paper&radius=0)
```

<img src="https://readmeme.eu.cc/api/profile.svg?avatar=https%3A%2F%2Fgithub.com%2Fcu-sanjay.png&name=Sanjay&role=Full-Stack+Developer&bio=Building+cool+things+with+code+n+coffee.&skills=HTML%2CJS%2CREACT%2CNODE%2CPYTHON%2CGIT%2CSQL&handle=cu-sanjay&theme=paper&radius=0" alt="Profile Preview Sharp" />

#### Theme: Paper | Soft edges (`radius=12`)

```md
![Profile Card](https://readmeme.eu.cc/api/profile.svg?avatar=https%3A%2F%2Fgithub.com%2Fcu-sanjay.png&name=Sanjay&role=Full-Stack+Developer&bio=Building+cool+things+with+code+n+coffee.&skills=HTML%2CJS%2CREACT%2CNODE%2CPYTHON%2CGIT%2CSQL&handle=cu-sanjay&theme=paper&radius=12)
```

<img src="https://readmeme.eu.cc/api/profile.svg?avatar=https%3A%2F%2Fgithub.com%2Fcu-sanjay.png&name=Sanjay&role=Full-Stack+Developer&bio=Building+cool+things+with+code+n+coffee.&skills=HTML%2CJS%2CREACT%2CNODE%2CPYTHON%2CGIT%2CSQL&handle=cu-sanjay&theme=paper&radius=12" alt="Profile Preview Soft" />

### 2. Now Playing Status

#### Theme: Terminal | YouTube Music

```md
![Now Playing](https://readmeme.eu.cc/api/music.svg?theme=terminal&musicSong=Smells+Like+Teen+Spirit&musicArtist=Nirvana&musicListen=Now+Playing&musicPlatform=ytmusic)
```

<img src="https://readmeme.eu.cc/api/music.svg?theme=terminal&musicSong=Smells+Like+Teen+Spirit&musicArtist=Nirvana&musicListen=Now+Playing&musicPlatform=ytmusic" alt="Music Preview Terminal" />

#### Theme: Ink | SoundCloud

```md
![Now Playing](https://readmeme.eu.cc/api/music.svg?theme=ink&musicSong=Tera+Intezaar&musicArtist=Rahat+Fateh+Ali+Khan&musicListen=On+Repeat&musicPlatform=soundcloud)
```

<img src="https://readmeme.eu.cc/api/music.svg?theme=ink&musicSong=Tera+Intezaar&musicArtist=Rahat+Fateh+Ali+Khan&musicListen=On+Repeat&musicPlatform=soundcloud" alt="Music Preview Ink" />

### 3. Live Local Time

#### Theme: Classic

```md
![Local Time](https://readmeme.eu.cc/api/time.svg?theme=classic&timezone=Asia/Kolkata&timeFormat=24h&showSeconds=1&showDate=1&showDay=1&label=Local+Time)
```

<img src="https://readmeme.eu.cc/api/time.svg?theme=classic&timezone=Asia/Kolkata&timeFormat=24h&showSeconds=1&showDate=1&showDay=1&label=Local+Time" alt="Time Preview Classic" />

#### Theme: Retro

```md
![Local Time](https://readmeme.eu.cc/api/time.svg?theme=retro&timezone=America/New_York&timeFormat=12h&showSeconds=0&showDate=0&showDay=0&label=NYC)
```

<img src="https://readmeme.eu.cc/api/time.svg?theme=retro&timezone=America/New_York&timeFormat=12h&showSeconds=0&showDate=0&showDay=0&label=NYC" alt="Time Preview Retro" />

### 4. Coding Streaks

```md
![Coding Streak](https://readmeme.eu.cc/api/streak.svg?theme=crimson&startDate=2023-01-01&unit=days&customLabel=LeetCode+Grind&platform=leetcode)
```

<img src="https://readmeme.eu.cc/api/streak.svg?theme=crimson&startDate=2023-01-01&unit=days&customLabel=LeetCode+Grind&platform=leetcode" alt="Streak Preview" />

### 5. Daily Quotes

```md
![Daily Quote](https://readmeme.eu.cc/api/quote.svg?theme=ocean&quoteCategory=programming&label=Daily+Wisdom)
```

<img src="https://readmeme.eu.cc/api/quote.svg?theme=ocean&quoteCategory=programming&label=Daily+Wisdom" alt="Quote Preview" />

### 6. Location & Timezone

```md
![Country Flag](https://readmeme.eu.cc/api/flag.svg?theme=forest&country=JP&label=Based+In)
```

<img src="https://readmeme.eu.cc/api/flag.svg?theme=forest&country=JP&label=Based+In" alt="Flag Preview" />

```md
![Timezone Banner](https://readmeme.eu.cc/api/timezone.svg?theme=ink&timezone=Europe/London&timeFormat=24h)
```

<img src="https://readmeme.eu.cc/api/timezone.svg?theme=ink&timezone=Europe/London&timeFormat=24h" alt="Timezone Preview" />

### 7. Time-based Skyline Banner & Profile Card

Procedural sky & ocean widgets that shift color palettes dynamically based on your local time.

#### Skyline Banner (defaults to live local time of timezone)

```md
![Skyline Banner](https://readmeme.eu.cc/api/skyline.svg?skylineStyle=banner&timezone=Asia/Kolkata&label=◑+TIDES)
```

<img src="https://readmeme.eu.cc/api/skyline.svg?skylineStyle=banner&time=680&label=◑+TIDES" alt="Skyline Banner Preview" />

#### Skyline Profile Card (with glassmorphism container and skill stack)

```md
![Skyline Profile Card](https://readmeme.eu.cc/api/skyline.svg?skylineStyle=card&time=1000&name=Alex+Developer&role=Front-End+Explorer&bio=Chasing+sunsets+and+beautiful+code.&skills=HTML%2CCSS%2CJS%2CREACT%2CTAILWIND%2CFIGMA&handle=alexdev&avatar=https%3A%2F%2Fgithub.com%2Fgithub.png)
```

<img src="https://readmeme.eu.cc/api/skyline.svg?skylineStyle=card&time=1000&name=Alex+Developer&role=Front-End+Explorer&bio=Chasing+sunsets+and+beautiful+code.&skills=HTML%2CCSS%2CJS%2CREACT%2CTAILWIND%2CFIGMA&handle=alexdev&avatar=https%3A%2F%2Fgithub.com%2Fgithub.png" alt="Skyline Profile Card Preview" />

### 8. Event Countdown

```md
![Hacktoberfest Countdown](https://readmeme.eu.cc/api/countdown.svg?theme=terminal&eventName=Hacktoberfest&targetDate=2026-10-31)
```

<img src="https://readmeme.eu.cc/api/countdown.svg?theme=terminal&eventName=Hacktoberfest&targetDate=2026-10-31" alt="Countdown Preview" />

### 9. YouTube Video Preview

#### Single Video Mode

```md
![YouTube Single](https://readmeme.eu.cc/api/youtube.svg?videoId=dQw4w9WgXcQ&theme=classic)
```

<img src="https://readmeme.eu.cc/api/youtube.svg?videoId=dQw4w9WgXcQ&theme=classic" alt="YouTube Single Preview" />

#### Multiple Videos Mode

```md
![YouTube Multiple](https://readmeme.eu.cc/api/youtube.svg?youtubeMode=multiple&videoIds=dQw4w9WgXcQ,yPYZpwvlWmc,jNQXAC9IVRw&theme=ocean)
```

<img src="https://readmeme.eu.cc/api/youtube.svg?youtubeMode=multiple&videoIds=dQw4w9WgXcQ,yPYZpwvlWmc,jNQXAC9IVRw&theme=ocean" alt="YouTube Multiple Preview" />




## Parameter Reference

### Global Parameters

| Parameter | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `theme`   | classic, paper, terminal, retro, ocean, crimson, forest, ink |
| `label`   | Custom widget label                                          |
| `radius`  | Corner roundness (`0` = sharp, `12` = soft)                  |

### Skyline Banner & Card

* `skylineStyle` (`banner` or `card`)
* `time` (0-24 hour override or 0-1000 slider override; empty for auto)
* `timezone`
* `avatar`
* `name`
* `role`
* `bio`
* `skills`
* `handle`

### Profile Card

* `avatar`
* `name`
* `role`
* `bio`
* `skills`
* `handle`

### Music Status

* `musicSong`
* `musicArtist`
* `musicPlatform`
* `musicListen`

### Time & Date

* `timezone`
* `timeFormat`
* `showSeconds`
* `showDate`
* `showDay`

### Streaks

* `startDate`
* `unit`
* `platform`

## Local Development

Clone the repository:

```bash
git clone https://github.com/cu-sanjay/stylish-readme.git
cd stylish-readme
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open:

```text
http://localhost:5000
```

The local widget workshop and preview environment will be available there.

> [!IMPORTANT]
>
> ### Serverless-First Architecture
>
> Stylish Readme is intentionally designed as a lightweight, serverless-native project.
>
> * Do not introduce persistent backend servers.
> * Do not add `server.js`, Express servers, custom runtimes, or long-running processes.
> * New features should be implemented using stateless logic compatible with edge and serverless deployments.
> * Maintain fast cold starts and minimal infrastructure requirements.
>
> Pull requests that introduce persistent server dependencies may not be accepted.

## Contributing

Contributions are welcome.

Before opening a pull request:

1. Keep changes focused and minimal.
2. Follow the existing code style.
3. Test your widget locally.
4. Avoid breaking existing URL parameters.
5. Respect the serverless-first architecture.

For full contribution guidelines, see:

**[CONTRIBUTING.md](./CONTRIBUTING.md)**
