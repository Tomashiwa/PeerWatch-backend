# PeerWatch

## Overview

This project is a web application to allow users to watch YouTube videos together and chat to one another. The video will kept in sync for all users in the same room.

![image](https://user-images.githubusercontent.com/15318860/140597009-ae8ed7e9-ea93-4d7d-b3f8-63898eabcde0.png)

Production Website: http://peerwatch.ap-southeast-1.elasticbeanstalk.com/

Project Report: [G37 PeerWatch](docs/G11_ChairVisE4.0.pdf)

##### Installation Guide

Pre-requisites: Node 14.5.3, Redis 5.0.7, MySQL 8.0.26, MySQL Workbench

1. Clone this repo.
2. Run `npm run install-all` at root directory
3. Start up a local Redis server by running `redis-server` in a terminal of your choice
4. Open up MySQLWorkbench and run the scripts in `./sql` to construct the DB tables
5. Run `npm run dev`
6. Access the application through http://localhost:3000

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
