// Basic Imports
const config = require("./config.js");
const client = require("./main.js");
const fs = require("fs");
const express = require("express");
const app = express();
app.set("view engine", "ejs");
const chalk = require("chalk");
const { EmbedBuilder } = require('discord.js');

// JSON Data
let settings = JSON.parse(fs.readFileSync("./data/settings.json"));

// Backend Initialization
const backend = require("./backend.js");
backend.init(app);

// Discord Login Passport
const passport = require("passport");
const e = require("connect-flash");
const DiscordStrategy = require("passport-discord-faxes").Strategy;
passport.serializeUser(function(user, done) { done(null, user) });
passport.deserializeUser(function(obj, done) { done(null, obj) });
passport.use(new DiscordStrategy({
    clientID: config.discord.oauthId,
    clientSecret: config.discord.oauthToken,
    callbackURL: `${(config.domain.endsWith("/") ? config.domain.slice(0, -1) : config.domain)}/auth/discord/callback`,
    scope: ["identify", "guilds", "email", "guilds.join"],
    prompt: "consent"
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
        return done(null, profile);
    });
}));

// Main Pages
app.get("/", async function(req, res) {
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        if(req.isAuthenticated()) {
            const isStaff = await backend.isStaff(req);
            const config = require("./config.js");
            const discordPerson = await client.users.fetch(req.session.passport.user.id);
            res.render("index", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, config: config, settings: settings, discordPerson: discordPerson, isStaff: isStaff, dpts: departments });
        } else {
            res.render("index", { loggedIn: req.isAuthenticated(), settings: settings, dpts: departments, config: config });
        }
    } else {
        if(req.isAuthenticated()) {
            const isOwner = await backend.isOwner(req);
            if(isOwner) {
                res.redirect("/Setup-Website")
            } else {
                res.redirect("/403")
            }
        } else {
            res.redirect("/auth/discord")
        }
    }
});

app.get("/Login", async function(req, res) {
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        if(req.isAuthenticated()) {
            res.redirect("/")
        } else {
            res.render("login", { settings: settings });
        }
    } else {
        if(req.isAuthenticated()) {
            const isOwner = await backend.isOwner(req);
            if(isOwner) {
                res.redirect("/Setup-Website")
            } else {
                res.redirect("/403")
            }
        } else {
            res.redirect("/auth/discord")
        }
    }
});

app.get("/Forums", async function(req, res) {
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        const appeals = JSON.parse(fs.readFileSync("./data/appeals.json"));

        const theGuild = await client.guilds.fetch(settings.GuildId);
        await theGuild.members.fetch(); // 🔥 REQUIRED

        if(req.isAuthenticated()) {
            const isStaff = await backend.isStaff(req);
            const discordPerson = await client.users.fetch(req.session.passport.user.id);
            const isStaffMember = await backend.isStaffMember(req);

            res.render("forums", {
                loggedIn: req.isAuthenticated(),
                user: req.session.passport.user,
                settings: settings,
                discordPerson: discordPerson,
                isStaff: isStaff,
                dpts: departments,
                appeals: appeals,
                theGuild: theGuild,
                isStaffMember: isStaffMember
            });
        } else {
            res.render("forums", {
                loggedIn: req.isAuthenticated(),
                settings: settings,
                dpts: departments,
                appeals: appeals,
                theGuild: theGuild,
                isStaffMember: false
            });
        }
    } else {
        if(req.isAuthenticated()) {
            const isOwner = await backend.isOwner(req);
            if(isOwner) {
                res.redirect("/Setup-Website")
            } else {
                res.redirect("/403")
            }
        } else {
            res.redirect("/auth/discord")
        }
    }
});

app.get("/Profile", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const isStaff = await backend.isStaff(req);
        const userId = req.query.userid;
        const guildShit = await client.guilds.fetch(settings.GuildId);
        const userShit = guildShit.members.cache.get(userId);
        const userShit2 = await client.users.fetch(userId);
        let roles = JSON.parse(fs.readFileSync("./data/roles.json"));
        let highestRole = "";
        const userRoles = userShit?.roles.cache?.map(role => role.name) ?? [];
        const rolePositions = roles.roles.filter(roleId => userRoles.includes(guildShit.roles.cache.get(roleId)?.name)).map(roleId => ({
            role: guildShit.roles.cache.get(roleId),
            position: guildShit.roles.cache.get(roleId)?.position
        }));
        rolePositions.sort((a, b) => b.position - a.position);
        const highestRole2 = rolePositions[0]?.role.name;
        if (highestRole2) {
            highestRole = rolePositions[0].role.name;
        } else {
            highestRole = "Member"
        }
        let users = JSON.parse(fs.readFileSync("./data/users.json"));
        let user = users.users.find(user => user.id === userId);
        if (!user) {
            users.users.push({
                id: userId,
                bio: "SASRP Member"
            })
            fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 4));
        }
        user = users.users.find(user => user.id === userId);
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        const applications = JSON.parse(fs.readFileSync("./data/applications.json"));
        let userAppsAppeals = [];
        for (const dpt in applications) {
            for (const app in applications[dpt].responses) {
                if (applications[dpt].responses[app].discord === userId) {
                    userAppsAppeals.push({
                        appeal: false,
                        type: dpt,
                        customId: app,
                        status: applications[dpt].responses[app].status
                    })
                }
            }
        }
        const appeals = JSON.parse(fs.readFileSync("./data/appeals.json"));
        for (const type in appeals) {
            for (const appeal in appeals[type].responses) {
                if (appeals[type].responses[appeal].discord === userId) {
                    userAppsAppeals.push({
                        appeal: true,
                        type: type,
                        customId: appeal,
                        status: appeals[type].responses[appeal].status
                    })
                }
            }
        }
        if (userId === req.session.passport.user.id) {
            res.render("profile", { loggedIn: req.isAuthenticated(), user: userShit2, weirdUser: "fuckyou", isOwner: isOwner, settings: settings, discordPerson: discordPerson, isStaff: isStaff, highestRole: highestRole, bio: user.bio, dpts: departments, apps: applications, userAppsAppeals: userAppsAppeals, userShit: userShit, error: req.flash("error") });
        } else {
            if (isStaff) {
                res.render("profile", { loggedIn: req.isAuthenticated(), user: userShit2, weirdUser: req.session.passport.user, isOwner: isOwner, settings: settings, discordPerson: discordPerson, isStaff: isStaff, highestRole: highestRole, bio: user.bio, dpts: departments, apps: applications, userAppsAppeals: userAppsAppeals, userShit: userShit, error: req.flash("error") });
            } else {
                res.redirect("/403")
            }
        }
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});


app.get("/Apply", backend.checkAuth, async function(req, res) {
    if (!req.query.dpt) return res.redirect("/");
    const isOwner = await backend.isOwner(req);
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const isStaff = await backend.isStaff(req);
        const isStaffMember = await backend.isStaffMember(req);
        const applications = JSON.parse(fs.readFileSync("./data/applications.json"));
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        for (const app in applications[req.query.dpt].responses) {
            if(applications[req.query.dpt].responses[app].discord === req.session.passport.user.id) {
                if (applications[req.query.dpt].responses[app].status ===  "Pending") {
                    req.flash("error", "You have already applied to this department.");
                    res.redirect("/Profile?userid=" + req.session.passport.user.id);
                    return;
                }
            }
        }
        if (departments[req.query.dpt].staffJob && !isStaffMember) {
            res.redirect("/403");
        } else {
            res.render("apply", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, settings: settings, discordPerson: discordPerson, isStaff: isStaff, application: applications[req.query.dpt], dpt: req.query.dpt, dpts: departments, error: req.flash("error") });
        }
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Appeal", backend.checkAuth, async function(req, res) {
    if (!req.query.type) return res.redirect("/");
    const isOwner = await backend.isOwner(req);
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const isStaff = await backend.isStaff(req);
        const appeals = JSON.parse(fs.readFileSync("./data/appeals.json"));
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        res.render("appeal", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, settings: settings, discordPerson: discordPerson, isStaff: isStaff, appeal: appeals[req.query.type], type: req.query.type, dpts: departments, error: req.flash("error") });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Staff", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const isStaff = await backend.isStaff(req);
        const isAppReviewer = await backend.isAppReviewer(req);
        const isAppealReviewer = await backend.isAppealReviewer(req);
        if (!isStaff) return res.redirect("/403");
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        res.render("staff", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, settings: settings, discordPerson: discordPerson, isStaff: isStaff, dpts: departments, isAppReviewer: isAppReviewer, isAppealReviewer: isAppealReviewer });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Applications-Staff", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const isStaff = await backend.isStaff(req);
        if (!isStaff) return res.redirect("/403");
        const isAppReviewer = await backend.isAppReviewer(req);
        if (!isAppReviewer) return res.redirect("/403");
        const applications = JSON.parse(fs.readFileSync("./data/applications.json"));
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        const memberThing = await client.guilds.cache.get(settings.GuildId).members.cache.get(req.session.passport.user.id);
        res.render("reviewApps", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, settings: settings, discordPerson: discordPerson, isStaff: isStaff, applications: applications, dpts: departments, memberThing: memberThing });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Applications-View", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const isStaff = await backend.isStaff(req);
        const isAppReviewer = await backend.isAppReviewer(req);
        const applications = JSON.parse(fs.readFileSync("./data/applications.json"));
        if (applications[req.query.dpt].responses[req.query.customId].discord !== req.session.passport.user.id) {
            if (!isAppReviewer) {
                return res.redirect("/403");
            }
        }
        const memberThing = await client.guilds.cache.get(settings.GuildId).members.cache.get(req.session.passport.user.id);
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        if (!req.query.dpt) return res.redirect("/Applications-Staff");
        if (!req.query.customId) return res.redirect("/Applications-Staff");
        res.render("viewApp", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, settings: settings, discordPerson: discordPerson, isStaff: isStaff, application: applications[req.query.dpt], dpts: departments, dpt: req.query.dpt, customId: req.query.customId, isAppReviewer: isAppReviewer, memberThing: memberThing });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Appeals-Staff", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const isStaff = await backend.isStaff(req);
        if (!isStaff) return res.redirect("/403");
        const isAppealReviewer = await backend.isAppealReviewer(req);
        if (!isAppealReviewer) return res.redirect("/403");
        const appeals = JSON.parse(fs.readFileSync("./data/appeals.json"));
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        const memberThing = await client.guilds.cache.get(settings.GuildId).members.cache.get(req.session.passport.user.id);
        res.render("reviewAppeals", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, dpts: departments, settings: settings, discordPerson: discordPerson, isStaff: isStaff, appeals: appeals, memberThing: memberThing });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Appeals-View", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const isStaff = await backend.isStaff(req);
        const isAppealReviewer = await backend.isAppealReviewer(req);
        const appeals = JSON.parse(fs.readFileSync("./data/appeals.json"));
        if (appeals[req.query.type].responses[req.query.customId].discord !== req.session.passport.user.id) {
            if (!isAppealReviewer) {
                return res.redirect("/403");
            }
        }
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        if (!req.query.type) return res.redirect("/Appeals-Staff");
        if (!req.query.customId) return res.redirect("/Appeals-Staff");
        res.render("viewAppeal", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, settings: settings, discordPerson: discordPerson, isStaff: isStaff, appeal: appeals[req.query.type], dpts: departments, type: req.query.type, customId: req.query.customId, isAppealReviewer: isAppealReviewer });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Department", async function(req, res) {
    if (!req.query.dpt) return res.redirect("/");
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        if(req.isAuthenticated()) {
            const isStaff = await backend.isStaff(req);
            const discordPerson = await client.users.fetch(req.session.passport.user.id);
            let thisDpt = departments[req.query.dpt];
            res.render("dpt", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, settings: settings, discordPerson: discordPerson, isStaff: isStaff, dpt: thisDpt, dptName: req.query.dpt, dpts: departments });
        } else {
            let thisDpt = departments[req.query.dpt];
            res.render("dpt", { loggedIn: req.isAuthenticated(), settings: settings, dpt: thisDpt, dptName: req.query.dpt, dpts: departments });
        }
    } else {
        if(req.isAuthenticated()) {
            const isOwner = await backend.isOwner(req);
            if(isOwner) {
                res.redirect("/Setup-Website")
            } else {
                res.redirect("/403")
            }
        } else {
            res.redirect("/auth/discord")
        }
    }
});

app.get("/Management-Panel", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    if (!isOwner) return res.redirect("/403");
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        const memberThing = await client.guilds.cache.get(settings.GuildId).members.cache.get(req.session.passport.user.id);
        const isStaff = await backend.isStaff(req);
        if (!isStaff) return res.redirect("/403");
        res.render("ownerPanel", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, dpts: departments, settings: settings, discordPerson: discordPerson, isStaff: isStaff, memberThing: memberThing });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Management-Panel/department=:dptOfChoice", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    if (!isOwner) return res.redirect("/403");
    if (!req.params.dptOfChoice) return res.redirect("/Management-Panel");
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        const applications = JSON.parse(fs.readFileSync("./data/applications.json"));
        const application = applications[req.params.dptOfChoice];
        const dpt = departments[req.params.dptOfChoice];
        const memberThing = await client.guilds.cache.get(settings.GuildId).members.cache.get(req.session.passport.user.id);
        const isStaff = await backend.isStaff(req);
        if (!isStaff) return res.redirect("/403");
        res.render("manageDpt", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, dpts: departments, settings: settings, discordPerson: discordPerson, isStaff: isStaff, memberThing: memberThing, application: application, dpt: dpt });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
});

app.get("/Create-Dpt", backend.checkAuth, async function(req, res) {
    const isOwner = await backend.isOwner(req);
    if (!isOwner) return res.redirect("/403");
    const discordPerson = await client.users.fetch(req.session.passport.user.id);
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        const departments = JSON.parse(fs.readFileSync("./data/departments.json"));
        const memberThing = await client.guilds.cache.get(settings.GuildId).members.cache.get(req.session.passport.user.id);
        const isStaff = await backend.isStaff(req);
        if (!isStaff) return res.redirect("/403");
        res.render("createDpt", { loggedIn: req.isAuthenticated(), user: req.session.passport.user, isOwner: isOwner, dpts: departments, settings: settings, discordPerson: discordPerson, isStaff: isStaff, memberThing: memberThing });
    } else {
        if(isOwner) {
            res.redirect("/Setup-Website")
        } else {
            res.redirect("/403")
        }
    }
})

app.get("/Setup-Website", backend.isOwnerMain, async function(req, res) {
    if(settings.ServerName && settings.ServerDesc && settings.Color && settings.GuildId && settings.LogChannelID && settings.DiscordInv && settings.StoreURL && settings.RulesLink) {
        res.redirect("/Settings")
    } else {
        res.render("setup", { user: req.session.passport.user, error: req.flash("error") });
    }
});

app.get("/Logout", async function(req, res) {
    if(req.isAuthenticated()) {
        req.logout();
        res.redirect("/")
    } else {
        res.redirect("/")
    }
});

// Backend Post Requests

app.post("/backend/GlobalSetup/submit", backend.isOwnerMain, async function(req, res) {
    if(req.body.servername && req.body.serverdesc && req.body.color && req.body.guildid && req.body.logs && req.body.discord && req.body.store && req.body.rules && req.body.staff) {
        settings = {
            ServerName: req.body.servername,
            ServerDesc: req.body.serverdesc,
            Color: req.body.color,
            GuildId: req.body.guildid,
            LogChannelID: req.body.logs,
            DiscordInv: req.body.discord,
            StoreURL: req.body.store,
            RulesLink: req.body.rules,
            StaffRole: req.body.staff
        }
        fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4));
    } else {
        req.flash("error", "Please fill out all fields.")
        res.redirect("/Setup-Website")
        return
    }
    res.redirect("/")
});

app.post("/backend/Update-Bio", backend.checkAuth, async function(req, res) {
    const userId = req.session.passport.user.id;
    const guildShit = await client.guilds.fetch(settings.GuildId);
    if (!req.body.bio) return res.redirect("/Profile?userid=" + userId);
    let users = JSON.parse(fs.readFileSync("./data/users.json"));
    let user = users.users.find(user => user.id === userId);
    if (!user) {
        users.users.push({
            id: userId,
            bio: req.body.bio
        })
        fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 4));
    }
    user = users.users.find(user => user.id === userId);
    user.bio = req.body.bio;
    fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 4));
    res.redirect("/Profile?userid=" + userId)
    const logEmbed = new EmbedBuilder()
    .setColor(settings.Color)
    .setTitle(`A user has updated their bio!`)
    .setTimestamp()
    .addFields(
        { name: `User:`, value: `<@${userId}>`, inline: false },
        { name: `New Bio:`, value: `\`\`\`${req.body.bio}\`\`\``, inline: false }
    )
    .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    let LogsChannel = client.channels.cache.get(settings.LogChannelID)
    if(LogsChannel) LogsChannel.send({embeds: [logEmbed]}).catch(function(err) {return;});
});

app.post("/backend/Apply/submit", backend.checkAuth, async function(req, res) {
    if (!req.query.dpt) return res.redirect("/");
    const userId = req.session.passport.user.id;
    const guildShit = await client.guilds.fetch(settings.GuildId);
    const userShit = guildShit.members.cache.get(userId);
    if (!userShit) return res.redirect("/403");
    const userShit2 = await client.users.fetch(userId);
    const isStaffMember = await backend.isStaffMember(req);
    const departments = JSON.parse(fs.readFileSync('./data/departments.json'))
    if (departments[req.query.dpt].staffJob && !isStaffMember) return res.redirect("/403");
    const applications = JSON.parse(fs.readFileSync('./data/applications.json'))
    for (const app in applications[req.query.dpt].responses) {
        if(applications[req.query.dpt].responses[app].discord === req.session.passport.user.id) {
            if (applications[req.query.dpt].responses[app].status ===  "Pending") {
                req.flash("error", "You have already applied to this department.");
                res.redirect("/Profile?userid=" + req.session.passport.user.id);
                return;
            }
        }
    }
    const application = applications[req.query.dpt].responses
    let currForum = -1;
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    application[uniqueId] = {
        "user": `${userShit2.username}`,
        "date": `${new Date(Date.now()).toLocaleString()}`,
        "status": "Pending",
        "discord": userId,
        "customId": uniqueId,
        "responses": {},
        "review": {}
    }
    fs.writeFileSync('./data/applications.json', JSON.stringify(applications, null, 4)) // Write changes to file
    let allQuestionsAnswered = true; // initialize to true
    for (const question in applications[req.query.dpt].questions) {
        currForum++
        const questionField = req.body["question" + currForum];
        if (questionField !== undefined) {
            application[uniqueId].responses[question] = questionField;
            fs.writeFileSync('./data/applications.json', JSON.stringify(applications, null, 4)) // Write changes to file
        } else {
            allQuestionsAnswered = false; // set to false if any question is unanswered
        }
    }
    if (!allQuestionsAnswered) { // check if all questions are answered
        req.flash("error", "Please fill out all questions.");
        res.redirect("/Apply?dpt=" + req.query.dpt);
        return;
    }
    res.redirect("/")
    const logEmbed = new EmbedBuilder()
    .setColor(settings.Color)
    .setTitle(`A user has applied to ${req.query.dpt}!`)
    .setDescription(`Click [here](${config.domain}/Applications-View?dpt=${req.query.dpt.replace(/\s/g, '%20')}&customId=${uniqueId}) to view the application.`)
    .setTimestamp()
    .addFields(
        { name: `User:`, value: `<@${userId}>`, inline: true }
    )
    .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    let LogsChannel = client.channels.cache.get(settings.LogChannelID)
    if(LogsChannel) LogsChannel.send({embeds: [logEmbed]}).catch(function(err) {return;});
});

app.post("/backend/Appeal/submit", backend.checkAuth, async function(req, res) {
    if (!req.query.type) return res.redirect("/");
    const userId = req.session.passport.user.id;
    const userShit2 = await client.users.fetch(userId);
    const appeals = JSON.parse(fs.readFileSync('./data/appeals.json'))
    const appeal = appeals[req.query.type].responses
    let currForum = -1;
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    appeal[uniqueId] = {
        "user": `${userShit2.username}`,
        "date": `${new Date(Date.now()).toLocaleString()}`,
        "status": "Pending",
        "discord": userId,
        "customId": uniqueId,
        "responses": {},
        "reviewedBy": {}
    }
    fs.writeFileSync('./data/appeals.json', JSON.stringify(appeals, null, 4)) // Write changes to file
    let allQuestionsAnswered = true; // initialize to true
    for (const question in appeals[req.query.type].questions) {
        currForum++
        const questionField = req.body["question" + currForum];
        if (questionField !== undefined) {
            appeal[uniqueId].responses[question] = questionField;
            fs.writeFileSync('./data/appeals.json', JSON.stringify(appeals, null, 4)) // Write changes to file
        } else {
            allQuestionsAnswered = false; // set to false if any question is unanswered
        }
    }
    if (!allQuestionsAnswered) { // check if all questions are answered
        req.flash("error", "Please fill out all questions.");
        res.redirect("/Appeal?type=" + req.query.type);
        return;
    }
    res.redirect("/")
    const logEmbed = new EmbedBuilder()
    .setColor(settings.Color)
    .setTitle(`A user has made an appeal!`)
    .setDescription(`Click [here](${config.domain}/Appeals-View?customId=${uniqueId}) to view the application.`)
    .setTimestamp()
    .addFields(
        { name: `User:`, value: `<@${userId}>`, inline: true }
    )
    .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    let LogsChannel = client.channels.cache.get(settings.LogChannelID)
    if(LogsChannel) LogsChannel.send({embeds: [logEmbed]}).catch(function(err) {return;});
});

app.post("/backend/Deny/Application", backend.checkAuth, async function(req, res) {
    if (!req.query.dpt) return res.redirect("/");
    if (!req.query.customId) return res.redirect("/");
    const userId = req.session.passport.user.id;
    const userShit2 = await client.users.fetch(userId);
    const isStaff = await backend.isStaff(req);
    if (!isStaff) return res.redirect("/403");
    const isAppReviewer = await backend.isAppReviewer(req);
    if (!isAppReviewer) return res.redirect("/403");
    const applications = JSON.parse(fs.readFileSync('./data/applications.json'))
    const application = applications[req.query.dpt].responses
    application[req.query.customId].status = "Denied"
    application[req.query.customId].review = {
        "reviewer": `${userShit2.username}`,
        "reviewerDiscord": userId,
        "reviewedOn": `${new Date(Date.now()).toLocaleString()}`,
        "reason": req.body.reason
    }
    fs.writeFileSync('./data/applications.json', JSON.stringify(applications, null, 4)) // Write changes to file
    res.redirect("/Applications-Staff")
    const logEmbed = new EmbedBuilder()
        .setColor(settings.Color)
        .setTitle(`A user has denied an application!`)
        .setTimestamp()
        .addFields(
            { name: `Staff Member:`, value: `<@${userId}>`, inline: false },
            { name: `Application:`, value: `[${req.query.dpt}](${config.domain}/Applications-View?dpt=${req.query.dpt.replace(/\s/g, '%20')}&customId=${req.query.customId})`, inline: false },
            { name: `Applicant:`, value: `<@${application[req.query.customId].discord}>`, inline: false },
            { name: `Reason:`, value: `\`\`\`${req.body.reason}\`\`\``, inline: false }
        )
        .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    const deniedEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`Your application for ${req.query.dpt} has been denied.`)
        .setTimestamp()
        .setDescription(`We regret to inform you that your **${req.query.dpt}** Application has been **DENIED**.\n\n**Reason:**\`\`\`${req.body.reason}\`\`\`\n\n**Application Denied By:** <@${userId}>`)
        .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });

    const LogsChannel = client.channels.cache.get(settings.LogChannelID)
    if(LogsChannel) LogsChannel.send({embeds: [logEmbed]}).catch(function(err) {return})
    const deniedChannel = client.channels.cache.get("1221350816913555466")
    if(deniedChannel) deniedChannel.send({ content: `Dear <@${application[req.query.customId].discord}>,`, embeds: [deniedEmbed]}).catch(function(err) {return})
});

app.post("/backend/Accept/Application", backend.checkAuth, async function(req, res) {
    if (!req.query.dpt) return res.redirect("/");
    if (!req.query.customId) return res.redirect("/");
    const userId = req.session.passport.user.id;
    const userShit2 = await client.users.fetch(userId);
    const isStaff = await backend.isStaff(req);
    if (!isStaff) return res.redirect("/403");
    const isAppReviewer = await backend.isAppReviewer(req);
    if (!isAppReviewer) return res.redirect("/403");
    const applications = JSON.parse(fs.readFileSync('./data/applications.json'))
    const application = applications[req.query.dpt].responses
    application[req.query.customId].status = "Accepted"
    application[req.query.customId].review = {
        "reviewer": `${userShit2.username}`,
        "reviewerDiscord": userId,
        "reviewedOn": `${new Date(Date.now()).toLocaleString()}`,
        "reason": "n/a"
    }
    fs.writeFileSync('./data/applications.json', JSON.stringify(applications, null, 4)) // Write changes to file
    res.redirect("/Applications-Staff")
    const logEmbed = new EmbedBuilder()
        .setColor(settings.Color)
        .setTitle(`A user has accepted an application!`)
        .setTimestamp()
        .addFields(
            { name: `Staff Member:`, value: `<@${userId}>`, inline: false },
            { name: `Application:`, value: `[${req.query.dpt}](${config.domain}/Applications-View?dpt=${req.query.dpt.replace(/\s/g, '%20')}&customId=${req.query.customId})`, inline: false },
            { name: `Applicant:`, value: `<@${application[req.query.customId].discord}>`, inline: false }
        )
        .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    const acceptedEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`Your application for ${req.query.dpt} has been accepted.`)
        .setTimestamp()
        .setDescription(`We would like to congratulate you on your **${req.query.dpt}** Application being **ACCEPTED**!\n\nCheck your DM's for more information.\n\n**Application Accepted By:** <@${userId}>`)
        .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    const logChannel = client.channels.cache.get(settings.LogChannelID);
    const acceptedChannel = client.channels.cache.get("1221350816913555466");
    if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] }).catch(function(err) { return; });
    }
    if (acceptedChannel) {
        await acceptedChannel.send({ content: `Dear <@${application[req.query.customId].discord}>,`, embeds: [acceptedEmbed] }).catch(function(err) { return; });
    }
});

app.post("/backend/Deny/Appeal", backend.checkAuth, async function(req, res) {
    if (!req.query.type) return res.redirect("/");
    if (!req.query.customId) return res.redirect("/");
    const userId = req.session.passport.user.id;
    const userShit2 = await client.users.fetch(userId);
    const isStaff = await backend.isStaff(req);
    if (!isStaff) return res.redirect("/403");
    const isAppealReviewer = await backend.isAppealReviewer(req);
    if (!isAppealReviewer) return res.redirect("/403");
    const appeals = JSON.parse(fs.readFileSync('./data/appeals.json'))
    const appeal = appeals[req.query.type].responses
    appeal[req.query.customId].status = "Denied"
    appeal[req.query.customId].review = {
        "reviewer": `${userShit2.username}`,
        "reviewerDiscord": userId,
        "reviewedOn": `${new Date(Date.now()).toLocaleString()}`,
        "reason": req.body.reason
    }
    fs.writeFileSync('./data/appeals.json', JSON.stringify(appeals, null, 4)) // Write changes to file
    res.redirect("/Appeals-Staff")
    const logEmbed = new EmbedBuilder()
        .setColor(settings.Color)
        .setTitle(`A user has denied an appeal!`)
        .setTimestamp()
        .addFields(
            { name: `Staff Member:`, value: `<@${userId}>`, inline: false },
            { name: `Appeal:`, value: `[${req.query.type}](${config.domain}/Applications-View?type=${req.query.type.replace(/\s/g, '%20')}&customId=${req.query.customId})`, inline: false },
            { name: `Appealer:`, value: `<@${appeal[req.query.customId].discord}>`, inline: false },
            { name: `Reason:`, value: `\`\`\`${req.body.reason}\`\`\``, inline: false }
        )
        .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    const LogsChannel = client.channels.cache.get(settings.LogChannelID)
    if(LogsChannel) LogsChannel.send({embeds: [logEmbed]}).catch(function(err) {return})
});

app.post("/backend/Accept/Appeal", backend.checkAuth, async function(req, res) {
    if (!req.query.type) return res.redirect("/");
    if (!req.query.customId) return res.redirect("/");
    const userId = req.session.passport.user.id;
    const userShit2 = await client.users.fetch(userId);
    const isStaff = await backend.isStaff(req);
    if (!isStaff) return res.redirect("/403");
    const isAppealReviewer = await backend.isAppealReviewer(req);
    if (!isAppealReviewer) return res.redirect("/403");
    const appeals = JSON.parse(fs.readFileSync('./data/appeals.json'))
    const appeal = appeals[req.query.type].responses
    appeal[req.query.customId].status = "Accepted"
    appeal[req.query.customId].review = {
        "reviewer": `${userShit2.username}`,
        "reviewerDiscord": userId,
        "reviewedOn": `${new Date(Date.now()).toLocaleString()}`,
        "reason": "n/a"
    }
    fs.writeFileSync('./data/appeals.json', JSON.stringify(appeals, null, 4)) // Write changes to file
    res.redirect("/Appeals-Staff")
    const logEmbed = new EmbedBuilder()
        .setColor(settings.Color)
        .setTitle(`A user has accepted an appeal!`)
        .setTimestamp()
        .addFields(
            { name: `Staff Member:`, value: `<@${userId}>`, inline: false },
            { name: `Appeal:`, value: `[${req.query.type}](${config.domain}/Appeals-View?type=${req.query.type.replace(/\s/g, '%20')}&customId=${req.query.customId})`, inline: false },
            { name: `Appealer:`, value: `<@${appeal[req.query.customId].discord}>`, inline: false }
        )
        .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    const logChannel = client.channels.cache.get(settings.LogChannelID);
    if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] }).catch(function(err) { return; });
    }
});

app.post("/backend/GlobalSettings/submit", backend.isOwnerMain, async function(req, res) {
    if (req.body.servername !== settings.ServerName) {
        const svrName = req.body.servername;
        if (svrName.length > 0) {
            settings.ServerName = req.body.servername;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.body.serverdesc !== settings.ServerDesc) {
        const svrDesc = req.body.serverdesc;
        if (svrDesc.length > 0) {
            settings.ServerDesc = req.body.serverdesc;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.body.color !== settings.Color) {
        const colar = req.body.color;
        if (colar.length > 0) {
            settings.Color = req.body.color;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.body.guildid !== settings.GuildId) {
        const theguildid = req.body.guildid;
        if (theguildid.length > 0) {
            settings.GuildId = req.body.guildid;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.body.logs !== settings.LogChannelID) {
        const thelogs = req.body.logs;
        if (thelogs.length > 0) {
            settings.LogChannelID = req.body.logs;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.body.discord !== settings.DiscordInv) {
        const thediscord = req.body.discord;
        if (thediscord.length > 0) {
            settings.DiscordInv = req.body.discord;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.body.store !== settings.StoreURL) {
        const thestore = req.body.store;
        if (thestore.length > 0) {
            settings.StoreURL = req.body.store;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.body.rules !== settings.RulesLink) {
        const therules = req.body.rules;
        if (therules.length > 0) {
            settings.RulesLink = req.body.rules;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.body.staff !== settings.StaffRole) {
        const thestaff = req.body.staff;
        if (thestaff.length > 0) {
            settings.StaffRole = req.body.staff;
        } else {
            req.flash("error", "Please fill out all fields.")
            res.redirect("/Settings")
            return
        }
    }
    if (req.files) {
        if (req.files.logo) {
            const logo = req.files.logo;
            if (logo.mimetype === "image/png" || logo.mimetype === "image/jpg" || logo.mimetype === "image/jpeg") {
                logo.mv("./public/images/logo.png", function(err) {
                    if (err) {
                        console.log(chalk.red("[ERROR] ") + err)
                    }
                });
            } else {
                req.flash("error", "Please upload a valid image.")
                res.redirect("/Settings")
                return
            }
        }
    }
    if (!req.body.servername && !req.body.serverdesc && !req.body.color && !req.body.guildid && !req.body.logs && !req.body.discord && !req.body.store && !req.body.rules && !req.body.staff && !req.files) {
        return res.redirect("/Settings")
    }
    fs.writeFileSync("./data/settings.json", JSON.stringify(settings, null, 4));
    res.redirect("/Settings")
    const logEmbed = new EmbedBuilder()
    .setColor(settings.Color)
    .setTitle(`A user has updated the Website Settings!`)
    .setTimestamp()
    .addFields(
        { name: `User:`, value: `<@${userId}>`, inline: true }
    )
    .setFooter({ text: settings.ServerName, iconURL: client.user.avatarURL() });
    let LogsChannel = client.channels.cache.get(settings.LogChannelID)
    if(LogsChannel) LogsChannel.send({embeds: [logEmbed]}).catch(function(err) {return;});
});

// Discord Login
app.get("/auth/discord", passport.authenticate("discord"));
app.get("/auth/discord/callback", passport.authenticate("discord", {failureRedirect: "/"}), async function(req, res) {
    req.session?.loginRef ? res.redirect(req.session.loginRef) : res.redirect("/");
    delete req.session?.loginRef
});

// Error Pages
app.get("/403", async function(req, res) {
    res.render("403");
});

// MAKE SURE THIS IS LAST FOR 404 PAGE REDIRECT
app.get("*", function(req, res){
    res.render("404");
});

// Server Initialization
app.listen(config.port)
console.log(chalk.blue("Started Forums on Port " + config.port));

// Rejection Handler
process.on("unhandledRejection", (err) => { 
    if(config.debugMode) console.log(chalk.red(err));
});