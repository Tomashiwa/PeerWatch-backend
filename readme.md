# PeerWatch
> This repository only contains the files for PeerWatch's backend. You may access the frontend repository [here](https://github.com/Tomashiwa/PeerWatch).

## Overview

This project is a web application to allow users to watch YouTube videos together and chat to one another. The video will kept in sync for all users in the same room.

![image](https://user-images.githubusercontent.com/15318860/140597009-ae8ed7e9-ea93-4d7d-b3f8-63898eabcde0.png)

Production Website: https://peerwatch.netlify.app/

**Backend is hosted on a Heroku's free-tier dyno, delay is expected when interacting with backend**

##### Installation Guide

Pre-requisites: Node 14.5.3, Redis 5.0.7, MySQL 8.0.26, MySQL Workbench

1. Clone this repo.
2. Run `npm install` at root directory
3. Create a `.env` file at root directory with the following template (Fill in the fields with `XXX` as its value)

```
ACCESS_SECRET=XXX
RESET_SECRET=XXX
EMAIL_USER=peerwatchteam@gmail.com
EMAIL_PASS=cs3219team37
DB_HOST=XXX
DB_USER=XXX
DB_PASS=XXX
DB_PORT=3306
LOCAL_DB_HOST=localhost
LOCAL_DB_USER=root
LOCAL_DB_PASS=password
LOCAL_DB_PORT=3306
```

4. Start up a local MySQL database that uses the credential stated in `.env`
5. Open up MySQL Workbench, connect to your local database and run the SQL scripts in `./sql` to construct the necessary tables
6. Start up a local Redis server by running `redis-server` in a terminal of your choice
7. Run `npm run dev`
8. Access the application through http://localhost:8080

##### Technology stack

-   Frontend: React
-   Backend: MySQL + Express JS + Redis
-   Key packages: React Player + Socket io + Material UI + Styled-components

##### Browser Support

| Browser | Google Chrome | Mozilla Firefox | Microsoft Edge | Opera         | Safari    |
| ------- | ------------- | --------------- | -------------- | ------------- | --------- |
| Version | 95.0.4638.69  | 94.0.1          | 95.0.1020.40   | 74.0.3911.139 | Mojave 12 |

-   This project is developed on Chrome but works on all listed browsers
-   Limited support for mobile resolutions
