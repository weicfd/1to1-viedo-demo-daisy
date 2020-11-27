<template>
  <div class="home">
    <h1>{{ msg }}</h1>
    <el-form ref="form" :model="basic" label-width="120px">
      <el-form-item label="Appid">
        <el-input v-model="basic.appid"></el-input>
      </el-form-item>
      <el-form-item label="Channel Name">
        <el-input v-model="basic.channel"></el-input>
      </el-form-item>
      <el-form-item label="Token">
        <el-input v-model="basic.token"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="joinEvent">join</el-button>
        <el-button type="primary" @click="leaveEvent">leave</el-button>
      </el-form-item>
    </el-form>
    <el-collapse class="advanced">
        <el-collapse-item title="ADVANCED SETTINGS">
          <el-form ref="form" :model="advanced" label-width="120px">
            <el-form-item label="UID">
              <el-input v-model="advanced.uid"></el-input>
            </el-form-item>
            <el-form-item label="CAMERA">
              <el-select v-model="advanced.cameraId">
                <el-option v-for="(cid, index) in cameraIds" :key="index" :label="cid" :value="cid"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="MICROPHONE">
              <el-select v-model="advanced.microphoneId">
                <el-option v-for="(mid, index) in microphoneIds" :key="index" :label="mid" :value="mid"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="CAMERA RESOLUTION">
              <el-select v-model="advanced.resolutions">
                <el-option v-for="(resolution, index) in cameraResolutions" :key="index" :label="resolution.name" :value="resolution.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="MODE">
              <el-radio-group v-model="advanced.mode">
                <el-radio label="live"></el-radio>
                <el-radio label="rtc"></el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="CODEC">
              <el-radio-group v-model="advanced.codec">
                <el-radio label="h264"></el-radio>
                <el-radio label="vp8"></el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-collapse-item>
    </el-collapse>
    
  </div>
</template>

<script>
export default {
  name: 'home',
  props: {
    msg: String
  },
  data() {
    return {
      basic: {
        appid: '',
        channel: '',
        token: ''
      },
      advanced: {
        uid: '',
        cameraId: '',
        microphoneId: '',
        cameraResolution: '',
        mode: 'live',
        codec: 'h264'
      },
      cameraIds: ['1', '2'],
      microphoneIds: ['1', '2'],
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
        value: "1080p"
      }
    ]
  }
},
methods: {
    joinEvent() {
      console.log('join!');
    },
    leaveEvent() {
      console.log('leave!');
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
