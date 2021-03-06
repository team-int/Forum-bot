const axios = require('axios').default;
const fs = require('fs');
const qs = require('querystring');
module.exports = {
    pathname: '/call-register/redirect',
    method: 'GET',
    run: async (client, req, res, parsed, ops) => {
        if (!parsed.query.code) {
            res.writeHead(401, {
                'strict-transport-security': 'max-age=86400; includeSubDomains; preload'
            });
            res.end('Discord authentication cancled');
        } else {
            axios.post('https://discord.com/api/oauth2/token', qs.stringify({
                client_id: client.user.id,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: parsed.query.code,
                scope: 'identify guilds',
                redirect_uri: process.env.CALL_REDIRECT
            }), {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            }).then(tokenRes => {
                axios.get('https://discord.com/api/users/@me', {
                    headers: {
                        Authorization: `Bearer ${tokenRes.data.access_token}`
                    }
                }).then(userRes => {
                    axios.get('https://discord.com/api/users/@me/guilds', {
                        headers: {
                            Authorization: `${tokenRes.data.token_type} ${tokenRes.data.access_token}`
                        }
                    }).then(async guildRes => {
                        if (!guildRes.data.find(x => x.id == ops.guildId)) {
                            res.writeHead(400, {
                                'strict-transport-security': 'max-age=86400; includeSubDomains; preload'
                            });
                            res.end('You\'re not in the guild');
                        } else {
                            if (userRes.data.bot == true) {
                                res.writeHead(403, {
                                    'strict-transport-security': 'max-age=86400; includeSubDomains; preload'
                                });
                                res.end('You\'re a bot');
                            } else {
                                if (!client.guilds.cache.get(ops.guildId).members.cache.get(userRes.data.id)) await client.guilds.cache.get(ops.guildId).members.fetch(userRes.data.id);
                                if (!ops.callTarget[userRes.data.id]) {
                                    res.writeHead(304, {
                                        'strict-transport-security': 'max-age=86400; includeSubDomains; preload'
                                    });
                                    res.end('You\'re not an admin');
                                } else {
                                    res.writeHead(200, {
                                        'content-type': 'text/html; charset=UTF-8',
                                        'strict-transport-security': 'max-age=86400; includeSubDomains; preload'
                                    });
                                    fs.readFile('./assets/html/call-callback.html', 'utf8', (err, data) => {
                                        res.end(data.replace(/{user}/gi, ops.callTarget[userRes.data.id]));
                                    });
                                }
                            }
                        }
                    })
                })
            }).catch(console.log)
        }
    }
}