<template>
  <div class="home">
    <header>
      <h1>{{ msg }}</h1>
    </header>
    <el-form ref="form" :model="option" label-width="120px">
      <el-form-item label="* Appid">
        <el-input v-model="option.appid"></el-input>
      </el-form-item>
      <el-form-item label="* Channel Name">
        <el-input v-model="option.channel"></el-input>
      </el-form-item>
      <el-form-item label="Token">
        <el-input v-model="option.token"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="joinEvent" :disabled='joined'>join</el-button>
        <el-button type="primary" @click="leaveEvent" plain :disabled='!joined'>leave</el-button>
        <el-button type="primary" @click="publishEvent" plain :disabled='!joined || published'>publish</el-button>
        <el-button type="primary" @click="unpublishEvent" plain :disabled='!joined || !published'>unpublish</el-button>
      </el-form-item>
    </el-form>
    <el-collapse class="advanced">
      <el-collapse-item title="ADVANCED SETTINGS">
        <el-form ref="form" :model="option" label-width="120px">
          <el-form-item label="UID">
            <el-input v-model="option.uid"></el-input>
          </el-form-item>
          <el-form-item label="CAMERA">
            <el-select v-model="option.cameraId">
              <el-option
                v-for="(cid, index) in cameraIds"
                :key="index"
                :label="cid.name"
                :value="cid.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="MICROPHONE">
            <el-select v-model="option.microphoneId">
              <el-option
                v-for="(mid, index) in microphoneIds"
                :key="index"
                :label="mid.name"
                :value="mid.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="CAMERA RESOLUTION">
            <el-select v-model="option.cameraResolution">
              <el-option
                v-for="(resolution, index) in cameraResolutions"
                :key="index"
                :label="resolution.name"
                :value="resolution.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="MODE">
            <el-radio-group v-model="option.mode">
              <el-radio label="live"></el-radio>
              <el-radio label="rtc"></el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="CODEC">
            <el-radio-group v-model="option.codec">
              <el-radio label="h264"></el-radio>
              <el-radio label="vp8"></el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-collapse-item>
    </el-collapse>
    <div class="agora-view">
      <div class="agora-video">
        <StreamPlayer
          :stream="localStream"
          :domId="localStream.getId()"
          v-if="localStream"
        ></StreamPlayer>
      </div>
      <div
        class="agora-video"
        :key="index"
        v-for="(remoteStream, index) in remoteStreams"
      >
        <StreamPlayer
          :stream="remoteStream"
          :domId="remoteStream.getId()"
        ></StreamPlayer>
      </div>
    </div>
  </div>
</template>

<script>
import RTCClient from "../plugins/agora-rtc-client";
import StreamPlayer from "./stream-player.vue";
import { log } from "../utils/utils";

export default {
  name: "home",
  props: {
    msg: String,
  },
  components: {
    StreamPlayer,
  },
  data() {
    return {
      option: {
        appid: "",
        channel: "",
        token: "",
        uid: "",
        cameraId: "",
        microphoneId: "",
        cameraResolution: "default",
        mode: "live",
        codec: "h264",
      },
      cameraIds: [],
      microphoneIds: [],
      cameraResolutions: [
        {
          name: "default",
          value: "default",
        },
        {
          name: "480p",
          value: "480p",
        },
        {
          name: "720p",
          value: "720p",
        },
        {
          name: "1080p",
          value: "1080p",
        },
      ],
      joined: false,
      published: false,
      localStream: null,
      remoteStreams: [],
    };
  },
  methods: {
    async publishEvent() {
      if(!this.rtc.client) {
        this.messageNotify("error", "Please Join Room First");
        return;
      }
      if(this.rtc.published) {
        this.messageNotify("error", "Your already published");
        return;
      }
      var oldState = this.rtc.published;
      try {
        let stream = await this.rtc.publishStream();
        this.messageNotify("success", "Publish Success");
        this.localStream = stream;
      } catch (err) {
        this.rtc.published = oldState;
        this.messageNotify("error", "Publish Failure:" + err);
        log("publish channel error", err);
        return;
      }
      this.published = this.rtc.published;
      this.joined = true;
    },
    async unpublishEvent() {
      if(!this.rtc.client) {
        this.messageNotify("error", "Please Join Room First");
        return;
      }
      if(this.joined && !this.rtc.published) {
        this.messageNotify("error", "Your didn't publish");
        return;
      }
      var oldState = this.rtc.published;
      try {
        await this.rtc.unpublishStream();
        this.messageNotify("success", "Unpublish Success");
      } catch (err) {
        this.rtc.published = oldState;
        this.messageNotify("error", "Unpublish Failure:" + err);
        log("unpublish channel error", err);
        return;
      }
      this.published = this.rtc.published;
    },
    async joinEvent() {
      // validate form fields
      if (!this.option.appid) {
        this.messageNotify("error", "Please enter an Appid");
        return;
      }
      if (!this.option.channel) {
        this.messageNotify("error", "Please enter a Channel Name");
        return;
      }
      // join
      try {
        await this.rtc.joinChannel(this.option);
        this.messageNotify("success", "Join Success");
      } catch (err) {
        this.messageNotify("error", "Join Failure:" + err);
        log("join channel error", err);
        return;
      }
      // publish
      await this.publishEvent();
    },
    async leaveEvent() {
      this.joined = false;
      if (this.published) {
        await this.unpublishEvent();
      }
      try {
        await this.rtc.leaveChannel();
        this.messageNotify("success", "Leave Success");
      } catch (err) {
        this.messageNotify("error", "Leave Failure:" + err);
        log("leave error", err);
        return;
      }
      this.localStream = null;
      this.remoteStreams = [];
    },
    messageNotify(type, msg) {
      this.$message({
        message: msg,
        type: type,
      });
    },
  },
  async created() {
    this.rtc = new RTCClient();
    let rtc = this.rtc;
    const devices = await rtc.getDevices();
    this.microphoneIds = devices.audios;
    this.option.microphoneId = this.microphoneIds[0].value;
    this.cameraIds = devices.videos;
    this.option.cameraId = this.cameraIds[0].value;

    rtc.on("stream-added", (evt) => {
      let { stream } = evt;
      log("[agora] [stream-added] stream-added", stream.getId());
      rtc.client.subscribe(stream);
    });

    rtc.on("stream-subscribed", (evt) => {
      let { stream } = evt;
      log("[agora] [stream-subscribed] stream-added", stream.getId());
      if (!this.remoteStreams.find((it) => it.getId() === stream.getId())) {
        this.remoteStreams.push(stream);
      }
    });

    rtc.on("stream-removed", (evt) => {
      let { stream } = evt;
      log("[agora] [stream-removed] stream-removed", stream.getId());
      this.remoteStreams = this.remoteStreams.filter(
        (it) => it.getId() !== stream.getId()
      );
    });

    rtc.on("peer-online", (evt) => {
      this.$message(`Peer ${evt.uid} is online`);
    });

    rtc.on("peer-leave", (evt) => {
      this.$message(`Peer ${evt.uid} already leave`);
      this.remoteStreams = this.remoteStreams.filter(
        (it) => it.getId() !== evt.uid
      );
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .home {
    margin-left: 20px;
  }
  header {
    text-align: center;
  }
  .agora-view {
    display: flex;
    flex-wrap: wrap;
  }
  .agora-video {
    width: 320px;
    height: 240px;
    margin: 20px;
  }
</style>
