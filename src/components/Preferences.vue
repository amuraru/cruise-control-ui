<!-- Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information. -->
<template>
  <div class="card">
    <div class="card-header">Cruise Control UI - Preferences</div>
    <div class="card-body">
      <table class="table table-bordered">
        <tbody>
          <tr><th colspan=2 class='text-center'>Appearance</th></tr>
          <tr>
            <td><label for="theme">Theme</label></td>
            <td>
              <select id="theme" class="form-select" v-model="theme">
                <option v-for="option in themes" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </td>
          </tr>
          <!--
          <tr><th colspan=2 class='text-center'>Auto Refresh UI Data</th></tr>
          <tr>
            <td>Enable Auto Reload of All REST end points on the UI</td>
            <th><input type="checkbox" v-model="$store.state.autoReloadEnabled"></th>
          </tr>
          <tr>
            <td>Auto Reload Interval in Milli Seconds</td>
            <th><input type="number" min='3000' v-model="$store.state.autoReloadInterval"></th>
          </tr>
          -->
          <tr><th colspan=2 class='text-center'>Help URLs</th></tr>
          <tr>
            <td>Hide REST URL details in the applications</td>
            <th><input type="checkbox" v-model="$store.state.hideHelperURL"></th>
          </tr>
          <tr><th colspan=2 class='text-center'>Modules to Enable</th></tr>
          <tr v-for="(v, k) in $store.state.modules" :key='k'>
            <td>Enable <b>{{ $formatters.camelCase(k) }}</b>  UI Module</td>
            <th><input type="checkbox" v-model="$store.state.modules[k]"></th>
          </tr>
          <tr><th colspan=2 class='text-center'>Server Exception Messages:</th></tr>
          <tr>
            <td>Show Full Stack Traces from Exception Responses</td>
            <th><input type="checkbox" v-model="$store.state.showFullStackTrace"></th>
          </tr>
          <!--
          <tr><th colspan=2 class='text-center'>Configuration Reload:</th></tr>
          <tr>
            <td>Enable Automatic refreshing of <code>config.csv</code> file</td>
            <th><input type="checkbox" v-model="$store.state.enableConfigFileReload"></th>
          </tr>
          <tr>
            <td>Automatic refreshing <code>config.csv</code> interval <i>(in Milli Seconds)</i></td>
            <th><input type="number" min='3000' placeholder='3000' :disabled='!$store.state.enableConfigFileReload' v-model="$store.state.configFileReloadInterval"></th>
          </tr>
          -->
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { currentTheme, setTheme, themes } from '../themes'

export default {
  name: 'Preferences',
  data () {
    return {
      store: this.$store,
      themes
    }
  },
  computed: {
    theme: {
      get () {
        return currentTheme.value
      },
      set (value) {
        setTheme(value)
      }
    }
  }
}
</script>

<style scoped>
.text-center {
  text-align: center
}
</style>
