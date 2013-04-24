// Replace with your own API key and session ID. See https://dashboard.tokbox.com/projects
var TOKBOX_API_KEY = 22961042,
	TOKBOX_SESSION_ID = '1_MX4yMjk2MTA0Mn4xMjcuMC4wLjF-V2VkIEFwciAyNCAxMzozMTozMCBQRFQgMjAxM34wLjQyNDk4MjV-',
	TOKBOX_TOKEN = 'T1==cGFydG5lcl9pZD0yMjk2MTA0MiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz01YzEwYzViNDgzZTk1ODA4OTE1YzA5N2MwN2RmYjRlYzkwZjZjNmU2OnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9MV9NWDR5TWprMk1UQTBNbjR4TWpjdU1DNHdMakYtVjJWa0lFRndjaUF5TkNBeE16b3pNVG96TUNCUVJGUWdNakF4TTM0d0xqUXlORGs0TWpWLSZjcmVhdGVfdGltZT0xMzY2ODM1NTE0Jm5vbmNlPTAuMDg4Nzg2Njc5ODg4NDgwNzcmZXhwaXJlX3RpbWU9MTM2OTQyNzUxNCZjb25uZWN0aW9uX2RhdGE9';

	
/***

	Initializes a TokBox remote webcam connection via WebRTC.

	@param Function onSubscribeCallback(videoElementHolderId) Called when a new video stream is available.
	@param Function onUnsubscribeCallback(videoElementHolderId) Called when a video stream is removed.

***/
var RemoteCam = function RemoteCam(onSubscribeCallback, onUnsubscribeCallback) {

	var isSupported = !!TB.checkSystemRequirements();

	if (isSupported) {

		var $remotecams = $('<div id="remotecams" style="position:absolute;z-index:-1;width:410px;height:410px;"></div>')
				.appendTo('body'),

			session = null, // the session
			publisher = null, // the published stream, populated once publishSelf is called

			/*** 

				creates a clip holder and adds the clip to LSD. 

				@returns the ID of the element to be replaced by the <video> object from session.subscribe().
			***/
			createClipHolder = function (connectionId) {
				var feedId = 'camSource_' + connectionId;

				$remotecams.append('<div id="' + feedId + '"><div id="' + feedId + '_el"></div></div>');

				onSubscribeCallback && onSubscribeCallback(feedId);

				return feedId + '_el';
			},

			hideClipHolder = function (connectionId) {
				var feedId = 'camSource_' + connectionId;

				$remotecams.find('#' + feedId).hide();

				onUnsubscribeCallback && onUnsubscribeCallback(feedId);
			},

			sessionConnectedDef = $.Deferred(),

			sessionConnectedHandler = function sessionConnectedHandler(event) {
				subscribeToStreams(event.streams);

				sessionConnectedDef.resolve();
			},

			publishSelf = function publishSelf() {

				sessionConnectedDef.then(function () {
					var feedId = createClipHolder(session.connection.connectionId);
					
					publisher = TB.initPublisher(TOKBOX_API_KEY, feedId, {
						name: 'self', 
						publishAudio: false,
						mirror : false
					});
					session.publish(publisher);
				});
			},

			unpublishSelf = function unpublishSelf() {
				sessionConnectedDef.then(function () {
					if (publisher) {
						session.unpublish(publisher);
					}
				});
			},
			
			streamCreatedHandler = function streamCreatedHandler(event) {
				subscribeToStreams(event.streams);
			},

			streamDestroyedHandler = function streamDestroyedHandler(event) {
				var streams = event.streams;

				for (i = 0; i < streams.length; i++) {
					var stream = streams[i];

					console && console.log("RemoteCam steam removed: " + stream.connection.connectionId);

					hideClipHolder(stream.connection.connectionId);
				}
			},
			
			subscribeToStreams = function subscribeToStreams(streams) {
				for (i = 0; i < streams.length; i++) {
					var stream = streams[i];
					if (stream.connection.connectionId != session.connection.connectionId) {
						var feedId = createClipHolder(stream.connection.connectionId);

						session.subscribe(stream, feedId);
					}
				}
			},
			
			exceptionHandler = function exceptionHandler(event) {
				console && console.log("RemoteCam Error: " + event.message);
			};


		TB.addEventListener("exception", exceptionHandler);
			
		session = TB.initSession(TOKBOX_SESSION_ID); 
		session.addEventListener("sessionConnected", sessionConnectedHandler);
		session.addEventListener("streamCreated", streamCreatedHandler);
		session.addEventListener("streamDestroyed", streamDestroyedHandler);
		session.connect(TOKBOX_API_KEY, TOKBOX_TOKEN);

		return {
			canPublish : isSupported,
			publish : publishSelf,
			unpublish : unpublishSelf
		};
	}
	else {
		return {
			canPublish : isSupported,
			publish : function () {
				console && console.log("RemoteCam not supported.");
			},
			unpublish : function () {}
		}
	}
};
