// Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information.

import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    chartColors: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
    configurl: './static/config.csv', // path to the cruise-control REST end-points
    config: {}, // remote cc urls information
    configError: null, // true if we have problem loading configuration
    configErrorMessage: null, // Actual configuration loading-error message
    url: null, // origin of the current CC we are dealing with
    online: true,
    autoReloadEnabled: false, // disabled by default
    autoReloadInterval: 30000, // 30 seconds
    // these control the enablement of a module in cruise control
    modules: {
      chart_page: true,
      state: true,
      kafkaclusterstate: true,
      load: true,
      // replicaload: false, This has been removed from backend code
      partitionload: true,
      proposals: true,
      user_tasks: true,
      // admin_state: true,
      admin_broker: true,
      // peer reviews module
      review: true
    },
    hideHelperURL: true,
    showFullStackTrace: false,
    // config.csv reload control variables
    enableConfigFileReload: false,
    configFileReloadInterval: 50000, // in milli seconds
    // user-task-id features
    userTasks: {
      // url: uuid (is the structure for this)
    }
  }),
  getters: {
    geturl: (state) => state.url,
    getnewurl: (state) => (group, label) => state.config[group][label],
    getTaskId: (state) => (url) => state.userTasks[url]
  },
  actions: {
    seturl (url) {
      this.url = url
    },
    setonline (online) {
      this.online = online
    },
    setConfig (newconfig) {
      this.config = newconfig
    },
    setConfigError (val) {
      this.configError = val
    },
    setConfigErrorMessage (val) {
      this.configErrorMessage = val
    },
    setTaskId (params) {
      if (params.taskid) {
        // set if the taskid is valid
        this.userTasks[params.url] = params.taskid
      } else {
        // delete if the taskid is invalid
        delete this.userTasks[params.url]
      }
    }
  }
})
