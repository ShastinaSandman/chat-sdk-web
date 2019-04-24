/**
 * Created by benjaminsmiley-andrews on 09/10/2014.
 */

angular.module('myApp.services').factory('Message', ['$rootScope', '$q', '$sce','UserStore', 'User', 'Config', 'Time', 'CloudImage',
    function ($rootScope, $q, $sce, UserStore, User, Config, Time, CloudImage) {

        var bMessageSideRight = 'right';
        var bMessageSideLeft = 'left';


        function Message(mid, meta) {

            this.setMID(mid);
            this.meta = meta;

            // Which side is the message on? 'left' or 'right'?
            this.side = null;
            this.timeString = null;
            this.user = null;
            this.flagged = false;

            this.read = false;

            if(meta) {

                if(!this.type()) {
                    this.setType(MessageTypeText);
                }

                if(this.type() == MessageTypeImage || this.type() == MessageTypeFile) {
                    // Get the image and thumbnail URLs
                    let json = meta[messageJSONv2];

                    if(json) {
                        if(this.type() == MessageTypeImage) {
                            this.thumbnailURL = CloudImage.cloudImage(json[messageImageURL], 200, 200);
                            this.imageURL = json[messageImageURL];
                        }
                        if(this.type() == MessageTypeFile) {
                            this.fileURL = json[messageFileURL];
                        }
                    }
                }

                // Our messages are on the right - other user's messages are
                // on the left
                this.side = this.uid() == $rootScope.user.uid() ? bMessageSideRight : bMessageSideLeft;

                this.timeString = Time.formatTimestamp(this.time(), Config.clockType);

                // Set the user
                if(this.uid()) {

                    // We need to set the user here
                    if(this.uid() == $rootScope.user.uid()) {
                        this.user = $rootScope.user;
                    }
                    else {
                        this.user = UserStore.getOrCreateUserWithID(this.uid());
                    }
                }
            }
        }

        Message.prototype = {

            markRead: function (uid) {
                this.read = true;
            },

            serialize: function () {
                return {
                    meta: this.meta,
                    mid: this.mid,
                    read: this.read,
                    flagged: this.flagged
                }
            },

            deserialize: function (sm) {
                this.mid = sm.mid;
                this.meta = sm.meta;
                this.read = sm.read;
                this.flagged = sm.flagged;
            },

            shouldHideUser: function (nextMessage) {
                return this.uid() == nextMessage.uid();
            },

            shouldHideDate: function (nextMessage) {
                // Last message date
                var lastDate = new Date(nextMessage.time());
                var newDate = new Date(this.time());

                // If messages have the same day, hour and minute
                // hide the time
                return lastDate.getDay() == newDate.getDay() && lastDate.getHours() == newDate.getHours() && lastDate.getMinutes() == newDate.getMinutes();
            },

            setTime: function (time) {
                this.setMetaValue(messageTime, time);
            },

            time: function () {
                return this.metaValue(messageTime);
            },

            setText: function (text) {
                this.setJSONValue(messageText, text);
            },

            text: function() {
                return this.getJSONValue(messageText);
            },

            getMetaValue: function (key) {
                return this.meta[key];
            },

            setMetaValue: function (key, value) {
                this.meta[key] = value;
            },

            getJSONValue: function (key) {
                return this.getMetaValue(messageJSONv2)[key];
            },

            setJSONValue: function (key, value) {
                this.getMetaValue(messageJSONv2)[key] = value;
            },

            type: function () {
                return this.metaValue(messageType);
            },

            setType: function (type) {
                this.setMetaValue(messageType, type);
            },

            uid: function () {
                return this.metaValue(messageUID);
            },

            setUID: function (uid) {
                this.setMetaValue(messageUID, uid);
            },

            metaValue: function (key) {
                if(this.meta) {
                    return this.meta[key];
                }
                return null;
            },

            setMetaValue: function (key, value) {
                if(!this.meta) {
                    this.meta = {};
                }
                this.meta[key] = value;
            },

            setMID: function (mid) {
                this.mid = mid;
            }




        };

        // Static methods
        Message.buildImageMeta = function (rid, uid, imageURL, thumbnailURL, width, height) {

            var text = imageURL+','+imageURL+',W'+width+"&H"+height;

            var m = Message.buildMeta(rid, uid, text, MessageTypeImage);

            var json = {};

            json[messageText] = text;
            json[messageImageURL] = imageURL;
            json[messageThumbnailURL] = thumbnailURL;
            json[messageImageWidth] = width;
            json[messageImageHeight] = height;

            m.meta[messageJSONv2] = json;

            return m;
        };

        Message.buildFileMeta = function (rid, uid, fileName, mimeType, fileURL) {

            var m = Message.buildMeta(rid, uid, fileName, MessageTypeFile);

            var json = {};

            json[messageText] = fileName;
            json[messageMimeType] = mimeType;
            json[messageFileURL] = fileURL;

            m.meta[messageJSONv2] = json;

            return m;
        };

        Message.buildMeta = function (rid, uid, text, type) {
            var m = {
                meta: {}
            };

            m.meta[messageUID] = uid;

            var json = {};
            json[messageText] = text;

            m.meta[messageJSONv2] = json;
            m.meta[messageType] = type;
            m.meta[messageTime] = firebase.database.ServerValue.TIMESTAMP;

            return m;
        };

        return Message;
}]);