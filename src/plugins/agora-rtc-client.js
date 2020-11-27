import AgoraRTC from 'agora-rtc-sdk'
import EventEmitter from 'events'

export default class RTCClient {
    constructor() {
        /**
         * option: {
         *  mode: string, "live" | "rtc"
         *  codec: string, "h264" | "vp8"
         *  appid: string
         *  channel: string, channel name
         *  uid: number
         *  token; string,
         *  microphoneId: string,
         *  cameraId: string
         * }
         **/
        this.option = {
            mode: '',
            codec: '',
            appid: '',
            channel: '',
            uid: 0,
            token: '',
            microphoneId: '',
            cameraId: '',
        }
        this.client = null
        this.localStream = null
        this.published = false
        this._eventBus = new EventEmitter()
    }

  getDevices() {
    console.log("getDevices")
    return new Promise((resolve, reject) => {
      AgoraRTC.getDevices((items) => {
        console.log("get devices success");
        items.filter(function (item) {
          return ["audioinput", "videoinput"].indexOf(item.kind) !== -1
        })
        .map(function (item) {
          return {
          name: item.label,
          value: item.deviceId,
          kind: item.kind,
          }
        })
        const videos = []
        const audios = []
        for (var i = 0; i < items.length; i++) {
          var item = items[i]
          if ("videoinput" == item.kind) {
            let name = item.label
            let value = item.deviceId
            if (!name) {
              name = "camera-" + videos.length
            }
            videos.push({
              name: name,
              value: value,
              kind: item.kind
            })
          }
          if ("audioinput" == item.kind) {
            let name = item.label
            let value = item.deviceId
            if (!name) {
              name = "microphone-" + audios.length
            }
            audios.push({
              name: name,
              value: value,
              kind: item.kind
            })
          }
        }
        resolve({videos: videos, audios: audios})
      }, (err) => {
        reject(err)
        console.error("get devices failed", err)
      })
    })
  }

    //init client and Join a channel
  joinChannel(option) {
    return new Promise((resolve, reject) => {
      console.log("joinChannel", option.mode, option.codec);
      this.client = AgoraRTC.createClient({mode: option.mode, codec: option.codec})
      this.client.init(option.appid, () => { 
        console.log("init success")
        this.clientListener()
        this.client.join(option.token ? option.token : null, option.channel, option.uid ? +option.uid : null, (uid) => {
          console.log("join channel: " + this.option.channel + " success, uid: ", uid)
          this.option = {
            appid: option.appid,
            token: option.token,
            channel: option.channel,
            uid: uid,
            microphoneId: option.microphoneId,
            cameraId: option.cameraId,
          }
          resolve()
        }, (err) => {
          reject(err)
          console.error("client join failed", err)
        })
      }, (err) => {
        reject(err)
        console.error(err)
      })
      console.log("[agora-vue] appId", option.appid)
     })
  }

  publishStream() {
    return new Promise((resolve, reject) => {
      // Create a local stream
      this.localStream = AgoraRTC.createStream({
        streamID: this.option.uid,
        audio: true,
        video: true,
        screen: false,
        microphoneId: this.option.microphoneId,
        cameraId: this.option.cameraId
      })
      // Initialize the local stream
      this.localStream.init(() => {
        console.log("init local stream success") 
        resolve(this.localStream)
        // Publish the local stream
        this.client.publish(this.localStream, (err) =>  {
          console.log("publish failed")
          console.error(err)
        })
        this.published = true
      }, (err) => {
        reject(err)
        console.error("init local stream failed ", err)
      })
    })
  }

  clientListener() {
    const client = this.client
    
    client.on('stream-added', (evt) => {
      // The stream is added to the channel but not locally subscribed
      this._eventBus.emit('stream-added', evt)
    })
    client.on('stream-subscribed', (evt) => {
      this._eventBus.emit('stream-subscribed', evt)
    })
    client.on('stream-removed', (evt) => {
      this._eventBus.emit('stream-removed', evt)
    })
    client.on('peer-online', (evt) => {
      this._eventBus.emit('peer-online', evt)
    })
    client.on('peer-leave', (evt) => {
      this._eventBus.emit('peer-leave', evt)
    })
  }

  on(eventName, callback) {
    this._eventBus.on(eventName, callback)
  }

  unpublishStream() {
    this.published = false
    return new Promise((resolve, reject) => {
      this.client.unpublish(this.localStream, (err) => {
        reject(err)
        console.log(err)
      })
      resolve()
    })
  }

  leaveChannel() {
    return new Promise((resolve, reject) => {
      // Leave the channel
      this.client.leave(() => {
        // Stop playing the local stream
        if (this.localStream.isPlaying()) {
          this.localStream.stop()
        }
        // Close the local stream
        this.localStream.close()
        this.client = null
        resolve()
        console.log("client leaves channel success");
      }, (err) => {
        reject(err)
        console.log("channel leave failed");
        console.error(err);
      })
    })
  }

}