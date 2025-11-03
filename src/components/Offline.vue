<!-- Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information. -->
<template>
  <div class="alert alert-warning" v-if='!isOnline()'>
    <b>NOTICE:</b> Hi there ! You are disconnected from Network. Application still shows the most recent data that was loaded from the server.
  </div>
</template>

<script>
import { useAppStore } from '@/store'

export default {
  name: 'Offline',
  setup() {
    const store = useAppStore()
    return { store }
  },
  methods: {
    setOnline () {
      this.store.setonline(true)
    },
    setOffline () {
      this.store.setonline(false)
    },
    isOnline () {
      return this.store.online
    }
  },
  created () {
    let vm = this
    window.addEventListener('online', vm.setOnline)
    window.addEventListener('offline', vm.setOffline)
  },
  beforeDestroy () {
    let vm = this
    window.removeEventListener('online', vm.setOnline)
    window.removeEventListener('offline', vm.setOffline)
  }
}
</script>
