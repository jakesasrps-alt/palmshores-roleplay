const config = require("./config.js");
const client = require("./main.js");
const fs = require('fs');
const passport = require('passport');
const multer = require('multer');
const bodyParser = require('body-parser');
const session  = require('express-session');
const express = require("express");
const flash = require('connect-flash');

// JSON Data
let settings = JSON.parse(fs.readFileSync('./data/settings.json'));
let departments = JSON.parse(fs.readFileSync('./data/departments.json'));

async function init(app, con) {
    if (Number(process.version.slice(1).split(".")[0] < 16)) throw new Error(`Node.js v16 or higher is required, Discord.JS relies on this version, please update @ https://nodejs.org`);
    var multerStorage = multer.memoryStorage()
    app.use(multer({ storage: multerStorage }).any());
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 31556952000},
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.use(express.static('public'));
    app.use('/assets', express.static(__dirname + 'public/assets'))
    app.use('/images', express.static(__dirname + 'public/images'))
    app.set('views', './views');
    app.set('view engine', 'ejs');
    app.use(function(req, res, next) {
        res.locals.loggedIn = req.isAuthenticated();
        next();
    });
};

async function checkAuth(req, res, next) {
    if(req.isAuthenticated()){
        next();
    } else {
        req.session.returnTo = req.originalUrl;
        res.redirect("/Login");
    }
};

async function guild(req) {
    if(req.isAuthenticated()){
        client.guilds.cache.get(settings.GuildId).members.cache.get(req.session.passport.user.id);
    } else {
        res.redirect('/')
    }
}

async function isOwnerMain(req, res, next) {
    if(req.isAuthenticated()) {
        const owners = config.discord.ownerId;
        if(owners.includes(req.session.passport.user.id)) {
            next();
        } else {
            res.redirect('/403')
        }
    } else {
        res.redirect('/')
    }
}

async function isOwner(req) {
    if(req.isAuthenticated()) {
        const owners = config.discord.ownerId;
        if(owners.includes(req.session.passport.user.id)) {
            return true
        } else {
            const potenialOwner = client.guilds.cache.get(settings.GuildId).members.cache.get(req.session.passport.user.id);
            if (potenialOwner) {
                if (potenialOwner?.roles.cache?.has("1160602257767804988")) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
        }
    } else {
        res.redirect('/')
    }
}

async function isStaffMember(req) {
    let foundRoles = 0;
    if (req.isAuthenticated()) {
        try {
            const theguild = await client.guilds.fetch(settings.GuildId);
            const discordPerson = await theguild.members.fetch(req.session.passport.user.id);
            const owners = config.discord.ownerId;
            if(owners.includes(req.session.passport.user.id)) {
                return true;
            } else {
                if (discordPerson) {
                    const staffMembers = departments["Staff Team"].roleId;
                    if (discordPerson.roles.cache.has(staffMembers)) {
                        foundRoles++;
                    }
                    if (foundRoles > 0) {
                        foundRoles = 0;
                        return true;
                    } else {
                        foundRoles = 0;
                        return false;
                    }
                } else {
                    return false;
                }
            }
        } catch (error) {
            console.error("Error in isStaffMember:", error);
            return false;
        }
    } else {
        res.redirect('/');
    }
}

async function isStaff(req) {
    let foundRoles = 0;
    if (req.isAuthenticated()) {
        try {
            const theguild = await client.guilds.fetch(settings.GuildId);
            const discordPerson = await theguild.members.cache.get(req.session.passport.user.id);
            const owners = config.discord.ownerId;
            if(owners.includes(req.session.passport.user.id)) {
                return true;
            } else {
                if (discordPerson) {
                    for (const department in departments) {
                        const appReviewers = departments[department].appReviewer;
                        if (discordPerson.roles.cache.has(appReviewers)) {
                            foundRoles++;
                        }
                    }
                    for (const setting in settings) {
                        const staffRoles = settings[setting].reviewer;
                        if (discordPerson.roles.cache.has(staffRoles)) {
                            foundRoles++;
                        }
                    }
                    if (foundRoles > 0) {
                        foundRoles = 0;
                        return true;
                    } else {
                        foundRoles = 0;
                        return false;
                    }
                } else {
                    return false;
                }
            }
        } catch (error) {
            console.error("Error in isStaff:", error);
            return false;
        }
    } else {
        res.redirect('/');
    }
}

async function isAppReviewer(req) {
    let foundRoles = 0;
    if (req.isAuthenticated()) {
        try {
            const theguild = await client.guilds.fetch(settings.GuildId);
            const discordPerson = await theguild.members.fetch(req.session.passport.user.id);
            const owners = config.discord.ownerId;
            if(owners.includes(req.session.passport.user.id)) {
                return true;
            } else {
                if (discordPerson) {
                    for (const department in departments) {
                        const appReviewers = departments[department].appReviewer;
                        if (discordPerson.roles.cache.has(appReviewers)) {
                            foundRoles++;
                        }
                    }
                    if (foundRoles > 0) {
                        foundRoles = 0;
                        return true;
                    } else {
                        foundRoles = 0;
                        return false;
                    }
                } else {
                    return false;
                }
            }
        } catch (error) {
            console.error("Error in isStaff:", error);
            return false;
        }
    } else {
        res.redirect('/');
    }
}

async function isAppealReviewer(req) {
    let foundRoles = 0;
    if (req.isAuthenticated()) {
        try {
            const theguild = await client.guilds.fetch(settings.GuildId);
            const discordPerson = await theguild.members.fetch(req.session.passport.user.id);
            const owners = config.discord.ownerId;
            if(owners.includes(req.session.passport.user.id)) {
                return true;
            } else {
                if (discordPerson) {
                    for (const setting in settings) {
                        const staffRoles = settings[setting].reviewer;
                        if (discordPerson.roles.cache.has(staffRoles)) {
                            foundRoles++;
                        }
                    }
                    if (foundRoles > 0) {
                        foundRoles = 0;
                        return true;
                    } else {
                        foundRoles = 0;
                        return false;
                    }
                } else {
                    return false;
                }
            }
        } catch (error) {
            console.error("Error in isStaff:", error);
            return false;
        }
    } else {
        res.redirect('/');
    }
}

module.exports = {
    init: init,
    checkAuth: checkAuth,
    guild: guild,
    isOwnerMain: isOwnerMain,
    isOwner: isOwner,
    isStaffMember: isStaffMember,
    isStaff: isStaff,
    isAppReviewer: isAppReviewer,
    isAppealReviewer: isAppealReviewer
};