/* Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information. */
import { useAppStore } from '@/store'
import buildUrl from 'build-url'
import parse from 'url-parse'
import mitt from 'mitt'

// Store instance for non-component usage
let globalStore = null

function setGlobalStore(store) {
  globalStore = store
}

function getURL (type, params) {
  // Try to get store from current context or use global store
  let store
  try {
    store = useAppStore()
  } catch (e) {
    store = globalStore
  }

  if (!store || !store.url) {
    console.warn('Store not available in getURL')
    return null
  }

  var url = store.url
  var parsed = parse(url)
  if (params === undefined || params == null) {
    params = {}
  }
  if (!params.hasOwnProperty('json')) {
    // demote broker doesn't like to have json param
    // remove this check once https://github.com/linkedin/cruise-control/issues/249 is fixed
    if (!type.match(/demote_broker|stop_proposal_execution|pause_sampling|resume_sampling/)) {
      params.json = true
    }
  }
  var sep = parsed.pathname && parsed.pathname.endsWith('/') ? '' : '/'
  if (type === 'replicaload') {
    parsed.set('pathname', parsed.pathname + sep + 'load')
  } else if (type === 'partitionload') {
    parsed.set('pathname', parsed.pathname + sep + 'partition_load')
  } else {
    parsed.set('pathname', parsed.pathname + sep + type)
  }
  // set the query parameters
  parsed.set('query', buildUrl(null, {queryParams: params}))
  return parsed.toString()
}

function datafix (v, _default) {
  if (!v) {
    return _default
  } else {
    return v
  }
}

// Create event bus for Vue 3
const eventBus = mitt()

export default {
  getURL: getURL,
  datafix: datafix,
  eventBus: eventBus,
  setGlobalStore: setGlobalStore
}
