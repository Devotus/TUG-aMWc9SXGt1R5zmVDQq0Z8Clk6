(function() {
    var app = angular.module('DevotusModels', []);

    app.factory('Categories', [function() {
        return ["Automation",
            "Cosmetics",
            "Generation",
            "Library",
            "Magic",
            "Miscellaneous",
            "Nature",
            "Technology",
            "Utility"
        ];
    }])

    app.factory('Media', ['uuid', function(uuid) {
        var Media = function(type, url, caption) {
            this.Id = uuid();
            switch (type.toLowerCase()) {
                case 'video':
                    this.Id = this.getVideoType(url) + this.Id;
                    this.Src = this.getVideoID(url) || "";
                    break;
                case 'image':
                case 'img':
                    this.Id = 'i' + this.Id;
                    this.Src = url || "";
                    break;
            }

            this.Caption = caption || "";
        }

        Media.prototype.getVideoType = function(val) {
            if (val.indexOf('youtu') > -1) {
                return 'v'; //youtube is v because legacy video id's were always youtube and started with v
            } else if (val.indexOf('vimeo') > -1) {
                return 'm';
            } else if (val.indexOf('dai.ly') > -1 || val.indexOf('dailymotion') > -1) {
                return 'd';
            } else {
                return 'i';
            }
        }

        Media.prototype.getVideoID = function(val) {
            val = val.replace("https://www.youtube.com/watch?v=", "").replace("https://www.youtube.com/embed/", "");
            val = val.replace("http://www.youtube.com/watch?v=", "").replace("http://www.youtube.com/embed/", "")
            val = val.replace("https://youtu.be/", "").replace("http://youtu.be/", "");
            val = val.replace("https://dai.ly/", "").replace("http://dai.ly/", "");
            val = val.replace("https://player.vimeo.com/video/", "").replace("http://player.vimeo.com/video/", "");
            val = val.replace("https://vimeo.com/", "").replace("http://vimeo.com/", "");
            val = val.replace(/https:\/\/vimeo.com\/channels\/[a-z0-9]+\/([0-9]+)/, "").replace(/http:\/\/vimeo.com\/channels\/[a-z0-9]+\/([0-9]+)/, "");
            val = val.replace("https://www.dailymotion.com/video/", "").replace("http://www.dailymotion.com/video/", "");
            if (val.indexOf('?') > 0)
                val = val.substring(0, val.indexOf('?'));
            if (val.indexOf('&') > 0)
                val = val.substring(0, val.indexOf('&'));
            return val;
        }

        return Media;
    }])

    app.factory('Author', function() {
        var Author = function() {
            this.GitUsername = "";
            this.NkUsername = "";
            this.Email = "";
        }

        return Author;
    })

    app.factory('Version', function() {
        var Version = function(major, minor, revision) {
            this.Major = Number(major) || 0;
            this.Minor = Number(minor) || 0;
            this.Revision = Number(revision) || 0;
        }

        Version.prototype.compare = function(other) {
            var otherV = other || new Version(0, 0, 0);

            if (this.Major < otherV.Major)
                return -1;
            else if (this.Minor < otherV.Minor && this.Major == otherV.Major)
                return -1;
            else if (this.Revision < otherV.Revision && this.Minor == otherV.Minor && this.Major == otherV.Major)
                return -1;
            else if (this.Revision == otherV.Revision && this.Minor == otherV.Minor && this.Major == otherV.Major)
                return 0;
            else
                return 1;
        }

        return Version;
    })

    app.factory('ReleasePacket', ['Version', function(Version) {
        var ReleasePacket = function(mod) {
            this.Name = mod.Name;
            this.TargetGame = mod.TargetGame || {
                Name: "TUG"
            };
            // Grab the current release's version, or default to the empty version.
            // Null guard included via ternary operator.
            if ( mod.CurrentRelease )
            {
              this.Version = mod.CurrentRelease.Version || new Version();
            }
            else
            {
               this.Version = new Version();
            }
        }

        return ReleasePacket;
    }])


    app.factory('Dependency', ['Version', function(Version) {
        var Dependency = function() {
            this.Name = "";
            this.Version = new Version();
        }

        return Dependency;
    }])

    app.factory('Game', function() {
        var Game = function() {
            this.Name = "";
            this.Version = {
                Major: 0,
                Minor: 0,
                Revision: 0
            }
        }

        return Game;
    })

    app.factory('Mod', ['Game', function(Game) {
        var Mod = function(mod) {
            if (mod) {
                this.cloneFrom(mod);
            } else {
                mod = {};
            }

            this.Name = mod.Name || "";
            this.Summary = mod.Summary || "";
            this.Description = mod.Description || "";
            this.Website = mod.Website || "";
            this.Active = mod.Active || false;
            this.TargetGame = mod.TargetGame || new Game();
            this.Categories = mod.Categories || [];
            this.Authors = mod.Authors || [];
            this.Dependencies = mod.Dependencies || [];
            this.Media = mod.Media || [];
            this.Script = mod.Script || {
                File: "",
                Class: ""
            };
        }

        Mod.prototype.addAuthor = function(author) {
            this.Authors.push(author)
        }

        Mod.prototype.createPacket = function() {
            var packet = {}
            if (this.Name)
                packet.Name = this.Name;
            if (this.Authors)
                packet.Authors = this.Authors;
            if (this.Summary)
                packet.Summary = this.Summary;
            if (this.Description)
                packet.Description = this.Description;
            if (this.Categories)
                packet.Categories = this.Categories;
            return packet;
        }

        Mod.prototype.updatePacket = function() {
            var packet = {}
            if (this.Name)
                packet.Name = this.Name;
            if (this.TargetGame)
                packet.TargetGame = {
                    Name: this.TargetGame.Name
                };
            return packet;
        }

        Mod.prototype.deleteMedia = function(mediaID) {
            var sections = null;
            if (this.WebPage) {
                sections = this.WebPage.Sections;
            }

            this.Media = this.Media.filter(function(e) {
                return e.Id != mediaID
            })

            if (sections) {
                //delete related media Id's out of user sections
                for (var s in sections) {
                    for (var c in sections[s].Content) {
                        var content = sections[s].Content[c];
                        if (content.Type == "MediaElement") {
                            var index = content.Items.indexOf(mediaID)
                            if (index >= 0) {
                                content.Items.splice(index, 1)
                            }
                        }
                        if (content.Type == "Tabs") {
                            for (var st in sections[s].Content[c].Items) {
                                var subcontent = sections[s].Content[c].Items[st].Content
                                for (var sc in subcontent) {
                                    if (subcontent[sc].Type == 'MediaElement') {
                                        var subindex = subcontent[sc].Items.indexOf(mediaID)
                                        if (subindex >= 0) {
                                            subcontent[sc].Items.splice(subindex, 1)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (this.Webpage) {
                //delete related media Id's out of default media sections
                var hIndex = []
                for (var h in this.WebPage.HeaderMedia) {
                    if (this.WebPage.HeaderMedia[h] == mediaID)
                        hIndex.push(h)
                }
                for (var hi in hIndex) {
                    this.WebPage.HeaderMedia.splice(hIndex[hi] - hi, 1)
                }

                var dIndex = []
                for (var d in this.WebPage.DetailMedia) {
                    if (this.WebPage.DetailMedia[d] == mediaID)
                        dIndex.push(d)
                }
                for (var di in dIndex) {
                    this.WebPage.DetailMedia.splice(dIndex[di] - di, 1)
                }
            }
        }

        return Mod;
    }])


})()
