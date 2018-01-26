(function() {
    var app = angular.module('WebServices', ["MessageHandler", 'Notify', 'DevotusModels']);
    var baseURL = 'https://devotus.nerdkingdom.com/v1';
    var authBaseURL = 'https://kadatherus.nerdkingdom.com';

    app.factory('ModServices', ['$http', 'msgHan', 'Notify', 'Mod', function($http, msgHan, Notify, Mod) {

        return {
            getAll: function(game, cb, options) {
                // Construct the API Endpoint URL.
                var optionStr = "?" + ((options) ? options : 'Inactives=true') ;
                var url = baseURL   +
                          "/games/" + game      +
                          "/mods"  + optionStr ;
                // Send request, handle response.
                $http.get(url).then(function(msg) {
                    if (cb) cb(msg.data)
                }, function(err) {
                    console.log(err)
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: "Error getting mods. " + errmsg ,
                        type: "error"
                    });
                })
            },
            get: function(game, mod, cb) {
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + game +
                          "/mods/"  + mod  ;
                // Send request, handle response.
                $http.get(url).then(function(msg) {
                    if (cb) cb(new Mod(msg.data))
                }, function(err) {
                    console.log(err)
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: "Error getting mod detail. " + errmsg ,
                        type: "error"
                    });
                })
            },
            getManifest: function(game, mod, cb) {
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + game     +
                          "/mods/"  + mod      +
                          '/manifest?dev=true' ;
                // Send request, handle response.
                $http.get(url).then(function(msg) {
                    if (cb) cb(new Mod(msg.data))
                }, function(err) {
                    console.log(err)
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: "Error getting mod manifest. " + errmsg ,
                        type: "error"
                    });
                })
            },
            create: function(game, data, cb) {
                // Success Callback.
                function processSuccess (msg) {
                    console.log(msg)
                    if (cb) cb(msg.data)
                }
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + game +
                          "/mods/"         ;
                // Adding a mod takes as much as 5 minutes to complete.
                // Prepare Event to handle the success message when it does.
                var source = new EventSource(url);
                source.addEventListener('message', processSuccess, false);
                // Send request, handle response.
                $http.post(url, angular.toJson(data)).then(processSuccess, function(err) {
                    console.log(err) ;
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: "Error creating mod. " + errmsg,
                        type: "error"
                    });
                })
            },
            release: function(data, cb) {
                // Success Callback.
                function processSuccess (msg) {
                    console.log(msg)
                    var cv = data.Version;
                    new Notify({
                        message: "Congratulations! " + data.Name +
                                  " v" + cv.Major    +
                                  "."  + cv.Minor    +
                                  "."  + cv.Revision + " has been queued for release." ,
                        type: "information"
                    });
                    if (cb) cb(true);
                }
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + data.TargetGame.Name +
                          "/mods/"  + data.Name            + '/releases';
                // Construct the minified Content Body.
                var newVersion = {
                      "Version" : data.Version
                      } ;
                // Send request, handle response.
                $http.post(url, angular.toJson(newVersion)).then(processSuccess, function(err) {
                    console.log(err)
                    if (cb) cb(false);

                    var errmsg = err.data.Message ;
                    new Notify({
                        message: "Error releasing mod. " + errmsg ,
                        type: "error"
                    });
                })
            },
            update: function(data, cb) {
                // Success Callback.
                function processSuccess (msg) {
                    console.log(msg)
                    new Notify({
                        message: "Devotus is building your mod. It will be ready for download shortly.",
                        type: "information"
                    });
                    if (cb) cb(msg.data)
                }
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + data.TargetGame.Name +
                          "/mods/"  + data.Name            ;
                // Send request, handle response.
                $http.post(url, angular.toJson(data)).then(processSuccess, function(err) {
                    console.log(err)
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: 'Unable to find a properly formatted tag newer than the current. ' + errmsg ,
                        type: "error"
                    });
                })
            },
            updateManifest: function(data, cb) {
                // Success Callback.
                function processSuccess (msg) {
                    console.log(msg)
                    msgHan.fire('AlertPopup.open', {
                        title: "Manifest Updated",
                        message: "The mod manifest has been updated. The public will not see these changes until a new release is published.",
                        cb: function() {

                        }
                    })
                    if (cb) cb(msg.data)
                }
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + data.TargetGame.Name +
                          "/mods/"  + data.Name            + '/manifest';
                // Send request, handle response.
                $http.put(url, angular.toJson(data)).then(processSuccess, function(err) {
                    console.log(err)
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: "Error updating manifest. " + errmsg,
                        type: "error"
                    });
                })
            },
            download: function(mod, cb) {
                // Validate that the requested release is actually newer, plus nullguard.
                if ((!mod.CurrentRelease || !mod.CurrentRelease.Version) ||
                    ( mod.CurrentRelease.Version.Major    == 0 &&
                      mod.CurrentRelease.Version.Minor    == 0 &&
                      mod.CurrentRelease.Version.Revision == 0 )) {
                    return new Notify({
                        message: 'The mod release you requested could not be downloaded at this time. Perhaps the mod is inactive or hasn\'t been updated.',
                        type: "error"
                    });
                }
                // Stringify the mod version.
                var versionString =       mod.CurrentRelease.Version.Major    +
                                    "." + mod.CurrentRelease.Version.Minor    +
                                    "." + mod.CurrentRelease.Version.Revision ;
                // Construct the API Endpoint URL.
                var url = baseURL       +
                          "/games/"     + mod.TargetGame.Name +
                          "/mods/"      + mod.Name            +
                          "/releases/"  + versionString       ;
                // Follow the link we just made.
                window.location = url;
            },
            delete: function(data, cb) {
                // Success Callback.
                function processSuccess (msg) {
                    console.log(msg)
                    new Notify({
                        message: "The mod has been removed.",
                        type: "information"
                    });
                    if (cb) cb(msg.data)
                }
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + data.TargetGame.Name +
                          "/mods/"  + data.Name            ;
                // Send request, handle response.
                $http.del(url, angular.toJson(data)).then(processSuccess, function(err) {
                    console.log(err)
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: 'Error deleting mod. ' + errmsg ,
                        type: "error"
                    });
                })
            },
            getAuthors: function(gameName, modName, cb) {
                // Success Callback.
                function processSuccess (msg) {
                    if (cb) cb(msg.data)
                }
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + gameName +
                          "/mods/"  + modName + "/authors";
                // Send request, handle response.
                $http.get(url).then(processSuccess, function(err) {
                    console.log(err);
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: 'Error getting authors. ' + errmsg ,
                        type: "error"
                    });
                });
            },
            addAuthor: function(gameName, modName, data, cb) {
                // Success Callback.
                function processSuccess (msg) {
                    if (cb) cb(msg.data)
                }
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + gameName +
                          "/mods/"  + modName + "/authors";

                //modify data because the endpoint expects PublicEmail instead of email like every other endpoint uses
                delete data.NkUsername;
                data.PublicEmail = data.Email;
                delete data.Email;

                // Send request, handle response.
                $http.post(url, angular.toJson(data)).then(processSuccess, function(err) {
                    console.log(err);
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: 'Error adding author. ' + errmsg ,
                        type: "error"
                    });
                });
            },
            changeStatus: function(gameName, modName, active, cb) {
                // Success Callback.
                function processSuccess (msg) {
                    if (cb) cb(msg.data)
                }
                // Construct the API Endpoint URL.
                var url = baseURL   +
                          "/games/" + gameName +
                          "/mods/"  + modName + "/status";
                var data = {
                    Active: active
                };
                // Send request, handle response.
                $http.put(url, angular.toJson(data)).then(processSuccess, function(err) {
                    console.log(err);
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: 'Error updating mod status. ' + errmsg ,
                        type: "error"
                    });
                });
            }
        }
    }])

    app.factory('GameServices', ['$http', 'msgHan', 'Notify', function($http, msgHan, Notify) {

        return {
            getAll: function(cb) {
                var url = baseURL + "/games/";
                $http.get(url).then(function(msg) {
                    if (cb) cb(msg.data)
                }, function(err) {
                    console.log(err)
                    var errmsg = err.data.Message ;
                    new Notify({
                        message: "Error getting games. " + errmsg ,
                        type: "error"
                    });
                    cb(null, err);
                })
            }
        }
    }])

    app.factory('UserServices', ['$http', 'msgHan', 'Notify', function($http, msgHan, Notify) {

        var clearCookies = function() {
            $.removeCookie('token', {
                path: '/'
            });
            $.removeCookie('userID', {
                path: '/'
            });
            $.removeCookie('modder', {
                path: '/'
            })
        }

        return {
            auth: function(user, pass, cb) {
                // Build the authenticate request.
                var url = authBaseURL + "/user/account/authenticate";
                var data = JSON.stringify({
                    userID: user,
                    userPass: pass
                });

                // Send the authenticate request.
                $http.post(url, data).then(function(msg) {
                    // Did the request succeed?
                    if (msg.data.result) {

                        // Store the session ID
                        $.cookie('token', msg.data.sid);

                        // Build the tags request.
                        url = authBaseURL + "/user/summary/tags";
                        data = JSON.stringify({
                            sid: msg.data.sid
                        });

                        // Send the tags request.
                        $http.post(url, data).then(function(msg2) {
                            // Did the tags request succeed?
                            if (msg2.data.result) {
                                // Store the data in the cookie.
                                $.cookie('userID', msg2.data.userName);
                                if (msg2.data.tags.indexOf('Devotum') > -1)
                                    $.cookie('modder', true)
                            } else
                                // Failure means erase the cookies.
                                clearCookies();

                            // Call the callback.
                            if (cb) cb(msg2.data)
                        }, function(err) {
                            console.log(err)
                            var excuse = "Could not contact auth server."
                            if (err.data && err.data.errorData)
                                excuse = err.data.errorData
                            new Notify({
                                message: excuse,
                                type: "error"
                            });
                            cb(err.data);
                        }) ;
                    } else {
                        // Failure means clear the cookies.
                        clearCookies();

                        // Call the callback.
                        if (cb) cb(msg.data)
                    }
                }, function(err) {
                    console.log(err)
                    var excuse = "Could not contact auth server."
                    if (err.data && err.data.errorData)
                        excuse = err.data.errorData
                    new Notify({
                        message: excuse,
                        type: "error"
                    });
                    cb(err.data);
                })
            },
            register: function(registration, cb) {
/*
                var url = authBaseURL + "/user/account/register";
                var data = angular.toJson(registration)

                $http.post(url, data).then(function(msg) {
                    if (cb) cb(msg.data)
                }, function(err) {
                    console.log(err)
                    var errmsg =  err.data.errorData ;
                    new Notify({
                        message: "Error registering account. " + errmsg ,
                        type: "error"
                    });
                    cb(err.data);
                })
*/
                // Until account registration workflows are complete, disabling functionality.
                new Notify({
                    message: "Account registration is disabled at this time.",
                    type: "error"
                });
                cb({ errorData: 'Account registration is disabled at this time.' });
            },
            forgotPassword: function(email, cb) {
/*
                var url = authBaseURL + "/user/password/forgot";
                var data = {
                    userID: email
                };

                $http.post(url, data).then(function(msg) {
                    if (cb) cb(msg.data);
                }, function(err) {
                    console.log(err)
                    var errmsg =  err.data.errorData ;
                    new Notify({
                        message: "Error resolving forgotten password. " + errmsg ,
                        type: "error"
                    });
                    cb(err.data);
                })
*/
                // Until forgot password workflows are complete, disabling functionality.
                new Notify({
                    message: "Forgot password is disabled at this time.",
                    type: "error"
                });
                cb({ errorData: 'Forgot password is disabled at this time.' });
            },
            logout: function(cb) {
                msgHan.fire('AreYouSurePopup.open', {
                    message: "This will end your session. Log out now?",
                    cb: function() {
                        var url = authBaseURL + "/user/session/logout";
                        var data = JSON.stringify({
                            sid: $.cookie('token')
                        });
                        $http.post(url, data).then(function(msg) {
                            clearCookies();
                            if (cb) cb(msg.data)
                            window.location = '/';
                        }, function(err) {
                            console.log(err)
                            clearCookies();
                            if (cb) cb(err.data);
                            window.location = '/';
                        })
                    }
                })
            },
            getModUsers: function(cb) {
                var url = authBaseURL + "/service/devotus/tag/users";

                $http.post(url).then(function(msg) {
                    if (cb) cb(msg.data.accounts)
                }, function(err) {
                    console.log(err)
                    var errmsg =  err.data.errorData ;
                    new Notify({
                        message: "Error getting user list. " + errmsg ,
                        type: "error"
                    });
                    cb(err.data);
                })
            },
        }
    }])


})()
