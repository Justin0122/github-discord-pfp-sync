const https = require('https');
const fs = require('fs');
const path = require('path');
const selfBot = require('discord.js-selfbot-v13');
require('dotenv').config();

const username = process.env.USERNAME;
const token = process.env.TOKEN;
const discordToken = process.env.DISCORD_TOKEN;

let previousProfilePic = '';

function checkProfileChanges() {
    const options = {
        hostname: 'api.github.com',
        path: `/users/${username}`,
        method: 'GET',
        headers: {
            'User-Agent': 'GitHub-Profile-Checker',
            Authorization: `token ${token}`,
        },
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                const userData = JSON.parse(data);
                const currentProfilePic = userData.avatar_url;

                if (previousProfilePic !== currentProfilePic) {
                    console.log('Profile picture URL has changed:', currentProfilePic);
                    previousProfilePic = currentProfilePic;
                    const file = fs.createWriteStream(path.join(__dirname, 'profile.png'));
                    https.get(currentProfilePic, (response) => {
                        response.pipe(file);
                    });
                    updateDiscordProfilePicture();
                } else {
                    console.log('Profile picture URL has not changed.');
                }
            } else {
                console.error('Failed to fetch profile data:', res.statusCode);
            }
        });
    });

    req.on('error', (error) => {
        console.error('Error fetching data:', error);
    });
    req.end();
}

function updateDiscordProfilePicture(){
    const client = new selfBot.Client({
        checkUpdate: false,
    });
    client.login(discordToken);
    client.on('ready', () => {
        console.log('Logged in as', client.user.tag);
        client.user.setAvatar(fs.readFileSync(path.join(__dirname, 'profile.png'))).then(r => console.log('Avatar set!')).catch(console.error);
    });

    setTimeout(() => {
        client.destroy();
        console.log('Client destroyed');
    }, Math.random() * 1000 * 60 * 4 + 1000 * 60);
}

checkProfileChanges();
setInterval(checkProfileChanges, 24 * 60 * 60 * 1000);
